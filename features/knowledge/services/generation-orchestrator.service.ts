import "server-only";
import { getBookForUser } from "@/features/books/services/book.service";
import { completeKnowledgeArtifact, listKnowledgeArtifacts, markKnowledgeArtifactFailed, markKnowledgeArtifactPayloadInvalid, normalizeKnowledgeArtifactLifecycle, requestKnowledgeArtifact, updateKnowledgeArtifact } from "@/features/knowledge/repositories/knowledge-artifact.repository";
import type { KnowledgeArtifactRecord, KnowledgeArtifactType } from "@/features/knowledge/types/knowledge";
import { FlashcardService } from "./flashcard.service";
import { KnowledgeArtifactService } from "./knowledge-artifact.service";
import { MindMapService } from "./mindmap.service";
import { QuizService } from "./quiz.service";
import { SummaryService } from "./summary.service";
import { TakeawayService } from "./takeaway.service";
import { flashcardsSchema, mindMapSchema, quizSchema, summarySchema, takeawaysSchema } from "./artifact-generation.utils";
import { randomUUID } from "crypto";
import { aiConfig } from "@/lib/config/ai.config";
import { failStaleKnowledgeArtifacts } from "@/features/knowledge/repositories/knowledge-artifact.repository";

export class GenerationOrchestratorService {
  public async list(bookId: string, clerkId: string): Promise<KnowledgeArtifactRecord[]> {
    await getBookForUser(bookId, clerkId);
    await normalizeKnowledgeArtifactLifecycle(bookId, clerkId);
    await failStaleKnowledgeArtifacts(bookId, clerkId, new Date(Date.now() - aiConfig.knowledge.staleGenerationTimeoutMs));
    const records = await listKnowledgeArtifacts(bookId, clerkId);
    const artifacts: KnowledgeArtifactRecord[] = [];
    for (const record of records) {
      const serialized = serializeArtifact(record);
      if (serialized) { artifacts.push(serialized); continue; }
      console.error("Knowledge artifact payload is invalid.", { artifactId: record._id.toString(), type: record.type });
      await markKnowledgeArtifactPayloadInvalid(bookId, clerkId, record._id.toString());
      artifacts.push(createUnavailableArtifact(record));
    }
    return artifacts;
  }

  public async request(bookId: string, clerkId: string, type: KnowledgeArtifactType): Promise<KnowledgeArtifactRecord> {
    const book = await getBookForUser(bookId, clerkId);
    if (book.processingStatus !== "READY") throw new Error("Knowledge can be generated after this book is ready.");
    const generationId = randomUUID();
    const artifact = await requestKnowledgeArtifact(bookId, clerkId, type, generationId);
    void this.run(bookId, clerkId, type, artifact._id.toString(), generationId).catch((error: unknown) => {
      console.error("Knowledge generation runner exited unexpectedly.", { artifactId: artifact._id.toString(), bookId, type, generationId, error });
    });
    const serialized = serializeArtifact(artifact);
    if (!serialized) throw new Error("Unable to prepare this learning material.");
    return serialized;
  }

  private async run(bookId: string, clerkId: string, type: KnowledgeArtifactType, artifactId: string, generationId: string): Promise<void> {
    try {
      await withTimeout(this.execute(bookId, clerkId, type, artifactId, generationId), aiConfig.knowledge.generationTimeoutMs);
    } catch (error) {
      console.error("Knowledge artifact generation failed.", { artifactId, bookId, type, generationId, error });
      try {
        await markKnowledgeArtifactFailed(bookId, clerkId, type, generationId);
      } catch (persistenceError) {
        console.error("Knowledge artifact failure state could not be persisted.", { artifactId, bookId, type, generationId, error: persistenceError });
      }
    }
  }

  private async execute(bookId: string, clerkId: string, type: KnowledgeArtifactType, artifactId: string, generationId: string): Promise<void> {
      await updateKnowledgeArtifact(bookId, clerkId, type, generationId, { status: "GENERATING", generationStage: "LOADING_SEGMENTS", progress: 10, startedAt: new Date(), lastProgressAt: new Date() });
      console.info("Knowledge generation started.", { artifactId, bookId, type, generationId });
      const foundation = new KnowledgeArtifactService();
      const batches = await foundation.getGrounding(bookId, clerkId, {
        onSegmentsLoaded: async () => { await updateKnowledgeArtifact(bookId, clerkId, type, generationId, { generationStage: "PREPARING_BATCHES", progress: 30, lastProgressAt: new Date() }); },
        onBatchPrepared: async (currentBatch, totalBatches) => { const progress = 30 + Math.round((currentBatch / totalBatches) * 20); await updateKnowledgeArtifact(bookId, clerkId, type, generationId, { generationStage: "PREPARING_BATCHES", progress, currentBatch, totalBatches, lastProgressAt: new Date() }); },
      });
      const citations = batches.flatMap((batch) => batch.citations).filter((citation, index, all) => all.findIndex((candidate) => candidate.segmentId === citation.segmentId) === index);
      await updateKnowledgeArtifact(bookId, clerkId, type, generationId, { generationStage: "GENERATING_CONTENT", progress: 50, currentBatch: 1, totalBatches: batches.length, lastProgressAt: new Date() });
      const payload = await this.generate(type, batches, citations, async (completedBatches, totalBatches) => {
        const progress = 50 + Math.round((completedBatches / totalBatches) * 30);
        console.info("Knowledge generation batch completed.", { artifactId, bookId, type, generationId, currentBatch: completedBatches, totalBatches });
        await updateKnowledgeArtifact(bookId, clerkId, type, generationId, { generationStage: "GENERATING_CONTENT", progress, currentBatch: completedBatches, totalBatches, lastProgressAt: new Date() });
      });
      await updateKnowledgeArtifact(bookId, clerkId, type, generationId, { generationStage: "VALIDATING", progress: 90, lastProgressAt: new Date() });
      if (!isValidArtifactPayload(type, payload)) throw new Error("Knowledge artifact payload validation failed.");
      await updateKnowledgeArtifact(bookId, clerkId, type, generationId, { generationStage: "SAVING", progress: 95, lastProgressAt: new Date() });
      await completeKnowledgeArtifact(bookId, clerkId, type, generationId, payload, citations);
      console.info("Knowledge generation completed.", { artifactId, bookId, type, generationId });
  }

  private async generate(type: KnowledgeArtifactType, batches: Awaited<ReturnType<KnowledgeArtifactService["getGrounding"]>>, citations: KnowledgeArtifactRecord["sourceSegments"], onProgress: (completedBatches: number, totalBatches: number) => Promise<void>) {
    switch (type) {
      case "SUMMARY": return { summary: await new SummaryService().generate(batches, onProgress) };
      case "TAKEAWAYS": return { takeaways: { items: (await new TakeawayService().generate(batches, onProgress)).items.map((item) => ({ ...item, citations })) } };
      case "FLASHCARDS": return { flashcards: { items: (await new FlashcardService().generate(batches, onProgress)).items.map((item) => ({ ...item, citations })) } };
      case "QUIZ": return { quiz: { items: (await new QuizService().generate(batches, onProgress)).items.map((item) => ({ ...item, citations })) } };
      case "MIND_MAP": return { mindMap: await new MindMapService().generate(batches, onProgress) };
    }
  }
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Knowledge generation timed out.")), timeoutMs);
    operation.then((value) => { clearTimeout(timer); resolve(value); }, (error: unknown) => { clearTimeout(timer); reject(error); });
  });
}

type PersistedArtifact = NonNullable<Awaited<ReturnType<typeof requestKnowledgeArtifact>>>;

function serializeArtifact(value: PersistedArtifact): KnowledgeArtifactRecord | undefined {
  if (!isPersistedPayloadValid(value)) return undefined;
  const citations = value.sourceSegments.map((citation) => ({ segmentId: citation.segmentId.toString(), pageNumber: citation.pageNumber }));
  const attach = <T extends { citations: unknown }>(items: T[] | undefined) => items?.map((item) => ({ ...item, citations: (item.citations as { segmentId: { toString(): string }; pageNumber: number }[]).map((citation) => ({ segmentId: citation.segmentId.toString(), pageNumber: citation.pageNumber })) }));
  const summary = value.summary && value.summary.executiveSummary && value.summary.overview && value.summary.conclusion ? { executiveSummary: value.summary.executiveSummary, overview: value.summary.overview, mainThemes: value.summary.mainThemes, importantConcepts: value.summary.importantConcepts, mainArguments: value.summary.mainArguments, conclusion: value.summary.conclusion } : undefined;
  const mindMap = value.mindMap ? { root: mindMapSchema.parse(value.mindMap.root) } : undefined;
  return { id: value._id.toString(), bookId: value.bookId.toString(), clerkId: value.clerkId, type: value.type, status: value.status, progress: value.progress, generationStage: value.generationStage ?? undefined, currentBatch: value.currentBatch ?? undefined, totalBatches: value.totalBatches ?? undefined, errorMessage: value.errorMessage ?? undefined, sourceSegments: citations, summary, takeaways: value.takeaways ? { items: attach(value.takeaways.items) ?? [] } : undefined, flashcards: value.flashcards ? { items: attach(value.flashcards.items) ?? [] } : undefined, quiz: value.quiz ? { items: attach(value.quiz.items) ?? [] } : undefined, mindMap, createdAt: value.createdAt.toISOString(), updatedAt: value.updatedAt.toISOString() };
}

function createUnavailableArtifact(value: PersistedArtifact): KnowledgeArtifactRecord {
  return { id: value._id.toString(), bookId: value.bookId.toString(), clerkId: value.clerkId, type: value.type, status: "FAILED", progress: 0, generationStage: value.generationStage ?? undefined, currentBatch: value.currentBatch ?? undefined, totalBatches: value.totalBatches ?? undefined, errorMessage: "This learning material needs to be generated again.", sourceSegments: [], createdAt: value.createdAt.toISOString(), updatedAt: value.updatedAt.toISOString() };
}

function isPersistedPayloadValid(value: PersistedArtifact): boolean {
  if (value.status !== "COMPLETED") return true;
  return isValidArtifactPayload(value.type, { summary: value.summary ?? undefined, takeaways: value.takeaways ?? undefined, flashcards: value.flashcards ?? undefined, quiz: value.quiz ?? undefined, mindMap: value.mindMap ? { root: value.mindMap.root } : undefined });
}

function isValidArtifactPayload(type: KnowledgeArtifactType, payload: { summary?: unknown; takeaways?: unknown; flashcards?: unknown; quiz?: unknown; mindMap?: unknown }): boolean {
  switch (type) {
    case "SUMMARY": return summarySchema.safeParse(payload.summary).success;
    case "TAKEAWAYS": return takeawaysSchema.safeParse(payload.takeaways).success;
    case "FLASHCARDS": return flashcardsSchema.safeParse(payload.flashcards).success;
    case "QUIZ": return quizSchema.safeParse(payload.quiz).success;
    case "MIND_MAP": return mindMapSchema.safeParse(payload.mindMap && typeof payload.mindMap === "object" && payload.mindMap !== null && "root" in payload.mindMap ? payload.mindMap.root : undefined).success;
  }
}
