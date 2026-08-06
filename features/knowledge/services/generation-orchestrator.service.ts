import "server-only";
import { getBookForUser } from "@/features/books/services/book.service";
import { completeKnowledgeArtifact, findKnowledgeArtifact, listKnowledgeArtifacts, markKnowledgeArtifactPayloadInvalid, normalizeKnowledgeArtifactLifecycle, prepareKnowledgeArtifactRegeneration, requestKnowledgeArtifact } from "@/features/knowledge/repositories/knowledge-artifact.repository";
import type { KnowledgeArtifactLifecycleRecord, KnowledgeArtifactRecord, KnowledgeArtifactType, KnowledgeGenerationRecord } from "@/features/knowledge/types/knowledge";
import { FlashcardService } from "./flashcard.service";
import { KnowledgeArtifactService } from "./knowledge-artifact.service";
import { MindMapService } from "./mindmap.service";
import { QuizService } from "./quiz.service";
import { SummaryService } from "./summary.service";
import { TakeawayService } from "./takeaway.service";
import { flashcardsSchema, mindMapSchema, quizSchema, summarySchema, takeawaysSchema } from "./artifact-generation.utils";
import { randomUUID } from "crypto";
import { log, logOperation, safeErrorMetadata } from "@/lib/observability/logger";
import { captureException } from "@/lib/observability/telemetry";
import { JobService } from "@/features/jobs/services/job.service";
import type { DurableJobCheckpoint } from "@/features/jobs/types/durable-job";
import {
  listKnowledgeGenerationBatchSummaries,
  saveKnowledgeGenerationBatchSummary,
} from "@/features/knowledge/repositories/knowledge-generation-batch.repository";
import type { BatchSummaryCheckpoint } from "./knowledge-artifact.service";
import { ProviderCallBudgetExceededError } from "@/lib/ai/generation/provider-call-budget-error";
import { aiConfig } from "@/lib/config/ai.config";
import { recordAiUsage } from "@/features/knowledge/repositories/ai-usage.repository";
import { createKnowledgeGeneration, findActiveKnowledgeGeneration, findKnowledgeGeneration, findLatestKnowledgeGeneration, isKnowledgeGenerationCancellationRequested, updateKnowledgeGeneration, type KnowledgeGenerationIdentity } from "@/features/knowledge/repositories/knowledge-generation.repository";

export class GenerationOrchestratorService {
  public async list(bookId: string, clerkId: string): Promise<KnowledgeArtifactRecord[]> {
    await getBookForUser(bookId, clerkId);
    await normalizeKnowledgeArtifactLifecycle(bookId, clerkId);
    const records = await listKnowledgeArtifacts(bookId, clerkId);
    const artifacts: KnowledgeArtifactRecord[] = [];
    for (const record of records) {
      const serialized = serializeArtifact(record);
      if (serialized) { artifacts.push(serialized); continue; }
      log("error", "knowledge.payload.invalid", { artifactId: record._id.toString(), artifactType: record.type });
      await markKnowledgeArtifactPayloadInvalid(bookId, clerkId, record._id.toString());
      artifacts.push(createUnavailableArtifact(record));
    }
    return artifacts;
  }

  public async getLifecycle(bookId: string, clerkId: string, type: KnowledgeArtifactType): Promise<KnowledgeArtifactLifecycleRecord> {
    await getBookForUser(bookId, clerkId);
    const [artifact, generation] = await Promise.all([findKnowledgeArtifact(bookId, clerkId, type), findLatestKnowledgeGeneration(clerkId, bookId, type)]);
    return { completedArtifact: artifact?.status === "COMPLETED" ? serializeArtifact(artifact) : undefined, activeGeneration: generation ? serializeGeneration(generation) : undefined };
  }

  public async request(bookId: string, clerkId: string, type: KnowledgeArtifactType): Promise<KnowledgeArtifactRecord> {
    const book = await getBookForUser(bookId, clerkId);
    if (book.processingStatus !== "READY") throw new Error("Knowledge can be generated after this book is ready.");
    const [existing, activeGeneration] = await Promise.all([findKnowledgeArtifact(bookId, clerkId, type), findActiveKnowledgeGeneration(clerkId, bookId, type)]);
    if (activeGeneration) {
      const serialized = existing ? serializeArtifact(existing) : undefined;
      if (!serialized) throw new Error("Unable to prepare this learning material.");
      return serialized;
    }
    if (existing && (existing.status === "REQUESTED" || existing.status === "GENERATING" || existing.status === "RETRYING")) {
      const serialized = serializeArtifact(existing);
      if (!serialized) throw new Error("Unable to prepare this learning material.");
      return serialized;
    }
    const generationId = existing?.status === "COMPLETED" || !existing ? randomUUID() : existing.generationId;
    const artifact = existing?.status === "COMPLETED" || !existing
      ? existing?.status === "COMPLETED"
        ? await prepareKnowledgeArtifactRegeneration(bookId, clerkId, type, generationId)
        : await requestKnowledgeArtifact(bookId, clerkId, type, generationId)
      : existing;
    if (!artifact) throw new Error("Unable to prepare this learning material.");
    const admitted = await createKnowledgeGeneration({ userId: clerkId, bookId, artifactId: artifact._id.toString(), artifactType: type, generationId });
    if (!admitted) throw new Error("Unable to prepare this learning material.");
    if (admitted.generationId !== generationId) {
      const serialized = serializeArtifact(artifact);
      if (!serialized) throw new Error("Unable to prepare this learning material.");
      return serialized;
    }
    await new JobService().enqueueKnowledgeGeneration({ bookId, clerkId, artifactId: artifact._id.toString(), artifactType: type, generationId });
    const serialized = serializeArtifact(artifact);
    if (!serialized) throw new Error("Unable to prepare this learning material.");
    return serialized;
  }

  public async runQueuedGeneration(
    bookId: string,
    clerkId: string,
    type: KnowledgeArtifactType,
    artifactId: string,
    generationId: string,
    assertLease: () => Promise<void>,
    signal: AbortSignal,
    jobCheckpoint: DurableJobCheckpoint,
    saveJobCheckpoint: (checkpoint: DurableJobCheckpoint) => Promise<void>,
  ): Promise<void> {
    const startedAt = Date.now();
    try {
      await this.execute(bookId, clerkId, type, artifactId, generationId, generationId, startedAt, assertLease, signal, jobCheckpoint, saveJobCheckpoint);
    } catch (error) {
      logOperation("error", "knowledge.generation.failed", startedAt, { artifactId, artifactType: type, ...safeErrorMetadata(error) });
      await captureException(error, { operation: "knowledge-generation" });
      throw error;
    }
  }

  public async markRetrying(bookId: string, clerkId: string, type: KnowledgeArtifactType, generationId: string): Promise<void> {
    await updateKnowledgeGeneration(generationIdentity(bookId, clerkId, type, generationId), { status: "RETRYING", errorMessage: "Generation is retrying after a temporary provider error.", lastProgressAt: new Date() });
  }

  public async markFailed(bookId: string, clerkId: string, type: KnowledgeArtifactType, generationId: string): Promise<void> {
    await updateKnowledgeGeneration(generationIdentity(bookId, clerkId, type, generationId), { status: "FAILED", progress: 0, failedAt: new Date(), errorMessage: "Generation temporarily unavailable. Please try again." });
  }

  public async markCancelled(bookId: string, clerkId: string, type: KnowledgeArtifactType, generationId: string): Promise<void> {
    await updateKnowledgeGeneration(generationIdentity(bookId, clerkId, type, generationId), { status: "CANCELLED", errorMessage: undefined });
  }

  /** Executes lifecycle transitions only. It never constructs a provider or calls Gemini. */
  public async runDryRun(bookId: string, clerkId: string, type: KnowledgeArtifactType, generationId: string): Promise<void> {
    const lifecycle = generationIdentity(bookId, clerkId, type, generationId);
    if (await isKnowledgeGenerationCancellationRequested(lifecycle)) {
      await this.markCancelled(bookId, clerkId, type, generationId);
      return;
    }
    await updateKnowledgeGeneration(lifecycle, { status: "PROCESSING", progress: 10, generationStage: "LOADING_SEGMENTS", startedAt: new Date(), lastProgressAt: new Date() });
    await updateKnowledgeGeneration(lifecycle, { status: "COMPLETED", progress: 100, completedAt: new Date(), generationStage: undefined, errorMessage: undefined });
  }

  private async execute(
    bookId: string,
    clerkId: string,
    type: KnowledgeArtifactType,
    artifactId: string,
    generationId: string,
    operationId: string,
    startedAt: number,
    assertLease: () => Promise<void>,
    signal: AbortSignal,
    jobCheckpoint: DurableJobCheckpoint,
    saveJobCheckpoint: (checkpoint: DurableJobCheckpoint) => Promise<void>,
  ): Promise<void> {
      throwIfAborted(signal);
      await assertLease();
      const lifecycle = generationIdentity(bookId, clerkId, type, generationId);
      const throwIfCancelled = async () => {
        if (await isKnowledgeGenerationCancellationRequested(lifecycle)) {
          await this.markCancelled(bookId, clerkId, type, generationId);
          throw new DOMException("Knowledge generation was cancelled.", "AbortError");
        }
      };
      const updateProgress = async (update: Record<string, unknown>) => {
        await updateKnowledgeGeneration(lifecycle, update);
      };
      await updateProgress({ status: "PROCESSING", generationStage: "LOADING_SEGMENTS", progress: 10, startedAt: new Date(), lastProgressAt: new Date() });
      log("info", "knowledge.generation.started", { operationId, artifactId, artifactType: type, generationId });
      const foundation = new KnowledgeArtifactService();
      const batches = await foundation.getGrounding(bookId, clerkId, {
        signal,
        onSegmentsLoaded: async () => { throwIfAborted(signal); await assertLease(); await updateProgress({ generationStage: "PREPARING_BATCHES", progress: 30, lastProgressAt: new Date() }); },
        onBatchPrepared: async (currentBatch, totalBatches) => { throwIfAborted(signal); await assertLease(); const progress = 30 + Math.round((currentBatch / totalBatches) * 20); await updateProgress({ generationStage: "PREPARING_BATCHES", progress, currentBatch, totalBatches, lastProgressAt: new Date() }); },
      });
      const citations = batches.flatMap((batch) => batch.citations).filter((citation, index, all) => all.findIndex((candidate) => candidate.segmentId === citation.segmentId) === index);
      throwIfAborted(signal); await assertLease();
      const storedSummaries = await listKnowledgeGenerationBatchSummaries(artifactId, bookId, clerkId, type, generationId);
      const completedSummaries = new Map(storedSummaries.map((batch) => [batch.batchIndex, batch.summary]));
      for (const batchIndex of completedSummaries.keys()) {
        if (batchIndex >= batches.length) throw new Error("Knowledge generation checkpoint does not match the prepared batches.");
      }
      const completedBatchCount = completedSummaries.size;
      await saveJobCheckpoint({
        phase: "GENERATING",
        completedBatches: completedBatchCount,
        totalBatches: batches.length,
      });
      await updateProgress({ generationStage: "GENERATING_CONTENT", progress: 50 + Math.round((completedBatchCount / batches.length) * 30), currentBatch: completedBatchCount || 1, totalBatches: batches.length, lastProgressAt: new Date() });
      const checkpoint: BatchSummaryCheckpoint = {
        completedSummaries,
        onBeforeBatch: async () => { await throwIfCancelled(); throwIfAborted(signal); await assertLease(); },
        saveSummary: async (batchIndex, summary) => {
          throwIfAborted(signal);
          await assertLease();
          await saveKnowledgeGenerationBatchSummary({ artifactId, bookId, clerkId, artifactType: type, generationId, batchIndex, summary });
          completedSummaries.set(batchIndex, summary);
          await saveJobCheckpoint({ phase: "GENERATING", completedBatches: completedSummaries.size, totalBatches: batches.length });
        },
        onProviderAttempt: async (model) => {
          await throwIfCancelled();
          throwIfAborted(signal);
          const providerCallCount = (jobCheckpoint.providerCallCount ?? 0) + 1;
          if (providerCallCount > aiConfig.knowledge.maxProviderCallsPerGeneration) throw new ProviderCallBudgetExceededError();
          jobCheckpoint.providerCallCount = providerCallCount;
          await saveJobCheckpoint({ phase: "GENERATING", completedBatches: completedSummaries.size, totalBatches: batches.length, providerCallCount });
          await recordAiUsage({ generationId, userId: clerkId, bookId, artifactType: type, provider: "gemini", model, operation: "GENERATION", durationMs: 0, success: false, retryCount: 0, providerCallNumber: providerCallCount });
        },
      };
      const payload = await this.generate(type, batches, citations, async (completedBatches, totalBatches) => {
        throwIfAborted(signal);
        await assertLease();
        const progress = 50 + Math.round((completedBatches / totalBatches) * 30);
        log("info", "knowledge.generation.batch_completed", { operationId, artifactId, artifactType: type, generationId, currentBatch: completedBatches, totalBatches });
        await updateProgress({ generationStage: "GENERATING_CONTENT", progress, currentBatch: completedBatches, totalBatches, lastProgressAt: new Date() });
      }, signal, checkpoint);
      await throwIfCancelled(); throwIfAborted(signal); await assertLease();
      await updateProgress({ generationStage: "VALIDATING", progress: 90, lastProgressAt: new Date() });
      if (!isValidArtifactPayload(type, payload)) throw new Error("Knowledge artifact payload validation failed.");
      throwIfAborted(signal); await assertLease();
      await updateProgress({ generationStage: "SAVING", progress: 95, lastProgressAt: new Date() });
      await assertLease();
      const [generation, latestGeneration] = await Promise.all([
        findKnowledgeGeneration(lifecycle),
        findLatestKnowledgeGeneration(clerkId, bookId, type),
      ]);
      if (generation?.status === "CANCEL_REQUESTED") {
        await this.markCancelled(bookId, clerkId, type, generationId);
        throw new DOMException("Knowledge generation was cancelled.", "AbortError");
      }
      if (
        generation?.status !== "PROCESSING" ||
        latestGeneration?.generationId !== generationId ||
        latestGeneration.status !== "PROCESSING"
      ) {
        throw new DOMException("Knowledge generation was superseded or cancelled.", "AbortError");
      }
      const published = await completeKnowledgeArtifact(bookId, clerkId, type, generationId, payload, citations);
      if (!published) throw new DOMException("Knowledge generation was superseded or cancelled.", "AbortError");
      await updateKnowledgeGeneration(lifecycle, { status: "COMPLETED", progress: 100, completedAt: new Date(), errorMessage: undefined });
      logOperation("info", "knowledge.generation.completed", startedAt, { operationId, artifactId, artifactType: type, generationId });
  }

  private async generate(type: KnowledgeArtifactType, batches: Awaited<ReturnType<KnowledgeArtifactService["getGrounding"]>>, citations: KnowledgeArtifactRecord["sourceSegments"], onProgress: (completedBatches: number, totalBatches: number) => Promise<void>, signal: AbortSignal, checkpoint: BatchSummaryCheckpoint) {
    switch (type) {
      case "SUMMARY": return { summary: await new SummaryService().generate(batches, onProgress, signal, checkpoint) };
      case "TAKEAWAYS": return { takeaways: { items: (await new TakeawayService().generate(batches, onProgress, signal, checkpoint)).items.map((item) => ({ ...item, citations })) } };
      case "FLASHCARDS": return { flashcards: { items: (await new FlashcardService().generate(batches, onProgress, signal, checkpoint)).items.map((item) => ({ ...item, citations })) } };
      case "QUIZ": return { quiz: { items: (await new QuizService().generate(batches, onProgress, signal, checkpoint)).items.map((item) => ({ ...item, citations })) } };
      case "MIND_MAP": return { mindMap: await new MindMapService().generate(batches, onProgress, signal, checkpoint) };
    }
  }

}

function generationIdentity(bookId: string, clerkId: string, artifactType: KnowledgeArtifactType, generationId: string): KnowledgeGenerationIdentity {
  return { userId: clerkId, bookId, artifactType, generationId };
}

function serializeGeneration(value: NonNullable<Awaited<ReturnType<typeof findLatestKnowledgeGeneration>>>): KnowledgeGenerationRecord {
  return { id: value._id.toString(), artifactId: value.artifactId.toString(), bookId: value.bookId.toString(), userId: value.userId, artifactType: value.artifactType, generationId: value.generationId, status: value.status, progress: value.progress, generationStage: value.generationStage ?? undefined, currentBatch: value.currentBatch ?? undefined, totalBatches: value.totalBatches ?? undefined, errorMessage: value.errorMessage ?? undefined, createdAt: value.createdAt.toISOString(), updatedAt: value.updatedAt.toISOString() };
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException("Knowledge generation was cancelled.", "AbortError");
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
