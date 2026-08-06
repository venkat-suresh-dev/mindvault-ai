import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getBook: vi.fn(),
  findArtifact: vi.fn(),
  updateArtifact: vi.fn(),
  requestArtifact: vi.fn(),
  prepareRegeneration: vi.fn(),
  createGeneration: vi.fn(),
  findActiveGeneration: vi.fn(),
  markArtifactFailed: vi.fn(),
  updateLifecycle: vi.fn(),
  cancellationRequested: vi.fn(),
  findGeneration: vi.fn(),
  findLatestGeneration: vi.fn(),
  completeArtifact: vi.fn(),
  getGrounding: vi.fn(),
  summaryGenerate: vi.fn(),
  batchSummaries: vi.fn(),
  saveBatchSummary: vi.fn(),
  enqueue: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/books/repositories/book-segment.repository", () => ({ findOrderedBookSegments: vi.fn() }));
vi.mock("@/features/chat/services/context-builder.service", () => ({ ContextBuilderService: class {} }));
vi.mock("@/lib/ai/generation", () => ({ createChatProvider: vi.fn() }));
vi.mock("@/lib/ai/generation/provider-call-budget-error", () => ({ ProviderCallBudgetExceededError: class extends Error {} }));
vi.mock("@/features/books/services/book.service", () => ({ getBookForUser: mocks.getBook }));
vi.mock("@/features/knowledge/repositories/knowledge-artifact.repository", () => ({
  completeKnowledgeArtifact: mocks.completeArtifact,
  findKnowledgeArtifact: mocks.findArtifact,
  listKnowledgeArtifacts: vi.fn(),
  markKnowledgeArtifactFailed: mocks.markArtifactFailed,
  markKnowledgeArtifactPayloadInvalid: vi.fn(),
  normalizeKnowledgeArtifactLifecycle: vi.fn(),
  requestKnowledgeArtifact: mocks.requestArtifact,
  prepareKnowledgeArtifactRegeneration: mocks.prepareRegeneration,
  updateKnowledgeArtifact: mocks.updateArtifact,
  failStaleKnowledgeArtifacts: vi.fn(),
}));
vi.mock("@/features/knowledge/repositories/knowledge-generation.repository", () => ({ createKnowledgeGeneration: mocks.createGeneration, findActiveKnowledgeGeneration: mocks.findActiveGeneration, findKnowledgeGeneration: mocks.findGeneration, findLatestKnowledgeGeneration: mocks.findLatestGeneration, isKnowledgeGenerationCancellationRequested: mocks.cancellationRequested, updateKnowledgeGeneration: mocks.updateLifecycle }));
vi.mock("@/features/jobs/services/job.service", () => ({ JobService: class { public enqueueKnowledgeGeneration = mocks.enqueue; } }));
vi.mock("@/features/jobs/repositories/durable-job.repository", () => ({ countActiveKnowledgeJobs: vi.fn().mockResolvedValue(0) }));
vi.mock("./flashcard.service", () => ({ FlashcardService: class {} }));
vi.mock("./knowledge-artifact.service", () => ({ KnowledgeArtifactService: class { public getGrounding = mocks.getGrounding; } }));
vi.mock("./mindmap.service", () => ({ MindMapService: class {} }));
vi.mock("./quiz.service", () => ({ QuizService: class {} }));
vi.mock("./summary.service", () => ({ SummaryService: class { public generate = mocks.summaryGenerate; } }));
vi.mock("./takeaway.service", () => ({ TakeawayService: class {} }));
vi.mock("@/features/knowledge/services/artifact-generation.utils", () => ({ flashcardsSchema: { safeParse: () => ({ success: true }) }, mindMapSchema: { safeParse: () => ({ success: true }) }, quizSchema: { safeParse: () => ({ success: true }) }, summarySchema: { safeParse: () => ({ success: true }) }, takeawaysSchema: { safeParse: () => ({ success: true }) } }));
vi.mock("@/lib/config/ai.config", () => ({ aiConfig: { knowledge: { staleGenerationTimeoutMs: 1, batchSegmentCount: 4, maxBatchContextTokens: 4_000, maxIntermediateTokens: 12_000, maxProviderCallsPerGeneration: 120 } } }));
vi.mock("@/lib/observability/logger", () => ({ log: vi.fn(), logOperation: vi.fn(), safeErrorMetadata: () => ({}) }));
vi.mock("@/lib/observability/telemetry", () => ({ captureException: vi.fn() }));
vi.mock("@/features/knowledge/repositories/knowledge-generation-batch.repository", () => ({ listKnowledgeGenerationBatchSummaries: mocks.batchSummaries, saveKnowledgeGenerationBatchSummary: mocks.saveBatchSummary }));
vi.mock("@/features/knowledge/repositories/ai-usage.repository", () => ({ recordAiUsage: vi.fn() }));

import { GenerationOrchestratorService } from "./generation-orchestrator.service";

const artifact = {
  _id: { toString: () => "artifact-1" },
  bookId: { toString: () => "book-1" },
  clerkId: "user-1",
  type: "FLASHCARDS" as const,
  generationId: "generation-1",
  status: "FAILED" as const,
  progress: 60,
  sourceSegments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("GenerationOrchestratorService retry request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBook.mockResolvedValue({ processingStatus: "READY" });
    mocks.findActiveGeneration.mockResolvedValue(null);
    mocks.createGeneration.mockImplementation(async (input: { generationId: string }) => ({ generationId: input.generationId }));
    mocks.cancellationRequested.mockResolvedValue(false);
    mocks.findGeneration.mockResolvedValue({ status: "PROCESSING" });
    mocks.findLatestGeneration.mockResolvedValue({ generationId: "generation-1", status: "PROCESSING" });
    mocks.getGrounding.mockResolvedValue([{ context: "context", citations: [] }]);
    mocks.summaryGenerate.mockResolvedValue({ executiveSummary: "summary", overview: "overview", mainThemes: [], importantConcepts: [], mainArguments: [], conclusion: "conclusion" });
    mocks.batchSummaries.mockResolvedValue([]);
    mocks.findArtifact.mockResolvedValue(artifact);
    mocks.updateArtifact.mockResolvedValue(artifact);
  });

  it("reuses the failed generation and artifact instead of creating a duplicate artifact", async () => {
    const result = await new GenerationOrchestratorService().request("book-1", "user-1", "FLASHCARDS");

    expect(result.id).toBe("artifact-1");
    expect(mocks.requestArtifact).not.toHaveBeenCalled();
    expect(mocks.updateArtifact).not.toHaveBeenCalled();
    expect(mocks.enqueue).toHaveBeenCalledWith(expect.objectContaining({ artifactId: "artifact-1", generationId: "generation-1" }));
  });

  it("keeps completed content intact and starts a separate lifecycle for regeneration", async () => {
    const completedArtifact = { ...artifact, status: "COMPLETED" as const, generationId: "generation-previous", flashcards: { items: [] } };
    const preparedArtifact = { ...completedArtifact, generationId: "generation-next" };
    mocks.findArtifact.mockResolvedValue(completedArtifact);
    mocks.prepareRegeneration.mockResolvedValue(preparedArtifact);

    await new GenerationOrchestratorService().request("book-1", "user-1", "FLASHCARDS");

    expect(mocks.prepareRegeneration).toHaveBeenCalledWith("book-1", "user-1", "FLASHCARDS", expect.any(String));
    expect(mocks.requestArtifact).not.toHaveBeenCalled();
    expect(mocks.updateArtifact).not.toHaveBeenCalled();
    expect(mocks.createGeneration).toHaveBeenCalledWith(expect.objectContaining({ artifactId: "artifact-1", artifactType: "FLASHCARDS", generationId: expect.any(String) }));
    expect(mocks.enqueue).toHaveBeenCalledWith(expect.objectContaining({ artifactId: "artifact-1", generationId: expect.any(String) }));
  });

  it("records regeneration failure on the lifecycle without changing completed content", async () => {
    mocks.findArtifact.mockResolvedValue({ ...artifact, status: "COMPLETED" as const, flashcards: { items: [] } });

    await new GenerationOrchestratorService().markFailed("book-1", "user-1", "FLASHCARDS", "generation-1");

    expect(mocks.markArtifactFailed).not.toHaveBeenCalled();
  });

  it("returns the active generation instead of enqueueing a duplicate request", async () => {
    mocks.findActiveGeneration.mockResolvedValue({ generationId: "generation-1", status: "PROCESSING" });

    await new GenerationOrchestratorService().request("book-1", "user-1", "FLASHCARDS");

    expect(mocks.enqueue).not.toHaveBeenCalled();
    expect(mocks.createGeneration).not.toHaveBeenCalled();
  });

  it("performs QUEUED to PROCESSING to COMPLETED in dry-run mode without touching the artifact", async () => {
    await new GenerationOrchestratorService().runDryRun("book-1", "user-1", "FLASHCARDS", "generation-1");
    expect(mocks.updateLifecycle).toHaveBeenNthCalledWith(1, expect.any(Object), expect.objectContaining({ status: "PROCESSING" }));
    expect(mocks.updateLifecycle).toHaveBeenLastCalledWith(expect.any(Object), expect.objectContaining({ status: "COMPLETED", progress: 100 }));
    expect(mocks.updateArtifact).not.toHaveBeenCalled();
  });

  it("performs CANCEL_REQUESTED to CANCELLED in dry-run mode without publishing", async () => {
    mocks.cancellationRequested.mockResolvedValue(true);
    await new GenerationOrchestratorService().runDryRun("book-1", "user-1", "FLASHCARDS", "generation-1");
    expect(mocks.updateLifecycle).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ status: "CANCELLED" }));
    expect(mocks.updateArtifact).not.toHaveBeenCalled();
  });

});

describe("GenerationOrchestratorService publish fencing", () => {
  const completedSummary = { executiveSummary: "old", overview: "old", mainThemes: [], importantConcepts: [], mainArguments: [], conclusion: "old" };
  const generatedSummary = { executiveSummary: "new", overview: "new", mainThemes: [], importantConcepts: [], mainArguments: [], conclusion: "new" };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cancellationRequested.mockResolvedValue(false);
    mocks.findGeneration.mockResolvedValue({ status: "PROCESSING" });
    mocks.findLatestGeneration.mockResolvedValue({ generationId: "generation-a", status: "PROCESSING" });
    mocks.getGrounding.mockResolvedValue([
      { context: "first", citations: [] },
      { context: "second", citations: [] },
    ]);
    mocks.batchSummaries.mockResolvedValue([]);
    mocks.summaryGenerate.mockResolvedValue(generatedSummary);
    mocks.completeArtifact.mockResolvedValue(true);
  });

  function runGeneration(generationId = "generation-a") {
    return new GenerationOrchestratorService().runQueuedGeneration(
      "book-1",
      "user-1",
      "SUMMARY",
      "artifact-1",
      generationId,
      vi.fn().mockResolvedValue(undefined),
      new AbortController().signal,
      {},
      vi.fn().mockResolvedValue(undefined),
    );
  }

  it("cancels at the final publish fence without changing the completed artifact", async () => {
    const stableArtifact = { summary: completedSummary, generationId: "generation-previous" };
    mocks.findGeneration.mockImplementation(async () => {
      mocks.cancellationRequested.mockResolvedValue(true);
      return { status: "CANCEL_REQUESTED" };
    });

    await expect(runGeneration()).rejects.toMatchObject({ name: "AbortError" });

    expect(mocks.completeArtifact).not.toHaveBeenCalled();
    expect(stableArtifact).toEqual({ summary: completedSummary, generationId: "generation-previous" });
    expect(mocks.updateLifecycle).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ status: "CANCELLED" }));
  });

  it("rejects a stale generation after a newer generation has published", async () => {
    const stableArtifact = { summary: generatedSummary, generationId: "generation-b" };
    mocks.findLatestGeneration.mockResolvedValue({ generationId: "generation-b", status: "COMPLETED" });

    await expect(runGeneration("generation-a")).rejects.toMatchObject({ name: "AbortError" });

    expect(mocks.completeArtifact).not.toHaveBeenCalled();
    expect(stableArtifact).toEqual({ summary: generatedSummary, generationId: "generation-b" });
  });

  it("resumes from persisted batches and publishes exactly once", async () => {
    mocks.batchSummaries.mockResolvedValue([{ batchIndex: 0, summary: "persisted first batch" }]);
    mocks.summaryGenerate.mockImplementation(async (_batches, onProgress, _signal, checkpoint) => {
      expect([...checkpoint.completedSummaries.entries()]).toEqual([[0, "persisted first batch"]]);
      await checkpoint.onBeforeBatch();
      await checkpoint.saveSummary(1, "new second batch");
      await onProgress?.(2, 2);
      return generatedSummary;
    });

    await runGeneration();

    expect(mocks.saveBatchSummary).toHaveBeenCalledTimes(1);
    expect(mocks.saveBatchSummary).toHaveBeenCalledWith(expect.objectContaining({ batchIndex: 1, summary: "new second batch" }));
    expect(mocks.completeArtifact).toHaveBeenCalledTimes(1);
    expect(mocks.completeArtifact).toHaveBeenCalledWith("book-1", "user-1", "SUMMARY", "generation-a", { summary: generatedSummary }, []);
  });
});
