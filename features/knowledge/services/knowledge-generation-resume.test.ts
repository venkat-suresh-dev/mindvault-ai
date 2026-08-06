import { beforeEach, describe, expect, it, vi } from "vitest";

const providerGenerate = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/generation", () => ({ createChatProvider: () => ({ generate: providerGenerate }) }));
vi.mock("@/features/books/repositories/book-segment.repository", () => ({ findOrderedBookSegments: vi.fn() }));
vi.mock("@/features/books/services/book.service", () => ({ getBookForUser: vi.fn() }));
vi.mock("@/features/chat/services/context-builder.service", () => ({ ContextBuilderService: class {} }));
vi.mock("@/lib/config/ai.config", () => ({ aiConfig: { knowledge: { batchSegmentCount: 4, maxBatchContextTokens: 4_000, maxIntermediateTokens: 12_000 } } }));

import { KnowledgeArtifactService, type GroundingBatch } from "./knowledge-artifact.service";

class TestKnowledgeArtifactService extends KnowledgeArtifactService {
  public summarize(
    batches: GroundingBatch[],
    completedSummaries: Map<number, string>,
    saveSummary: (batchIndex: number, summary: string) => Promise<void>,
  ): Promise<string> {
    return this.summarizeBatches(batches, undefined, undefined, { completedSummaries, saveSummary, onBeforeBatch: async () => undefined, onProviderAttempt: async () => undefined });
  }

  public summarizeWithCheckpoint(batches: GroundingBatch[], checkpoint: Parameters<KnowledgeArtifactService["summarizeBatches"]>[3]): Promise<string> {
    return this.summarizeBatches(batches, undefined, undefined, checkpoint);
  }
}

const batches: GroundingBatch[] = [
  { context: "batch zero", citations: [] },
  { context: "batch one", citations: [] },
  { context: "batch two", citations: [] },
];

describe("knowledge generation batch resume", () => {
  beforeEach(() => vi.clearAllMocks());
  it("resumes at batch N + 1 after a persisted batch failure without calling Gemini for completed batches", async () => {
    const persisted = new Map<number, string>();
    const saveSummary = vi.fn(async (batchIndex: number, summary: string) => {
      persisted.set(batchIndex, summary);
    });
    providerGenerate
      .mockResolvedValueOnce("summary zero")
      .mockResolvedValueOnce("summary one")
      .mockRejectedValueOnce(new Error("provider unavailable"))
      .mockResolvedValueOnce("summary two");

    const service = new TestKnowledgeArtifactService();
    await expect(service.summarize(batches, persisted, saveSummary)).rejects.toThrow("provider unavailable");
    expect([...persisted.keys()]).toEqual([0, 1]);
    expect(providerGenerate).toHaveBeenCalledTimes(3);

    await expect(service.summarize(batches, persisted, saveSummary)).resolves.toBe(
      "summary zero\n\nsummary one\n\nsummary two",
    );
    expect(providerGenerate).toHaveBeenCalledTimes(4);
    expect(providerGenerate.mock.calls[3][0].prompt).toContain("batch two");
    expect(saveSummary).toHaveBeenCalledTimes(3);
  });

  it("keeps the persisted provider budget across a checkpoint resume and does not charge completed batches again", async () => {
    const persisted = new Map<number, string>([[0, "summary zero"], [1, "summary one"]]);
    let providerCallCount = 5;
    const onProviderAttempt = vi.fn(async () => { providerCallCount += 1; });
    providerGenerate.mockImplementationOnce(async (input: { onAttempt?: (model: string) => Promise<void> }) => {
      await input.onAttempt?.("gemini-3.5-flash");
      return "summary two";
    });
    const service = new TestKnowledgeArtifactService();
    await service.summarizeWithCheckpoint(batches, { completedSummaries: persisted, saveSummary: async (index, summary) => { persisted.set(index, summary); }, onBeforeBatch: async () => undefined, onProviderAttempt });
    expect(providerGenerate).toHaveBeenCalledOnce();
    expect(providerCallCount).toBe(6);
    expect(onProviderAttempt).toHaveBeenCalledOnce();
  });
});
