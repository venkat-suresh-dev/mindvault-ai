import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ page: vi.fn(), update: vi.fn(), usage: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/embeddings", () => ({ createEmbeddingProvider: vi.fn(), EmbeddingGenerationError: class extends Error {} }));
vi.mock("@/features/books/repositories/book-segment.repository", () => ({ findBookSegmentsWithoutEmbeddingsPage: mocks.page, bulkUpdateBookSegmentEmbeddings: mocks.update }));
vi.mock("@/lib/config/ai.config", () => ({ aiConfig: { embeddings: { batchSize: 2, model: "gemini-embedding-001" } } }));
vi.mock("@/features/knowledge/repositories/ai-usage.repository", () => ({ recordAiUsage: mocks.usage }));

import { EmbeddingService } from "./embedding.service";

describe("EmbeddingService resume", () => {
  beforeEach(() => vi.clearAllMocks());
  it("only embeds pages still missing embeddings after a restart", async () => {
    mocks.page.mockResolvedValueOnce([{ id: "3", segmentIndex: 2, text: "remaining" }]).mockResolvedValueOnce([]);
    const provider = { embedDocuments: vi.fn().mockResolvedValue([{ vector: [1], model: "test", dimensions: 1 }]), embedQuery: vi.fn() };
    await new EmbeddingService(provider).embedBookSegments("book", "user-1");
    expect(provider.embedDocuments).toHaveBeenCalledWith(["remaining"], undefined, expect.any(Function));
    expect(mocks.update).toHaveBeenCalledOnce();
    expect(mocks.page).toHaveBeenCalledWith("book", 2, 2);
  });
  it("records one privacy-safe usage event for every provider attempt", async () => {
    mocks.page.mockResolvedValueOnce([{ id: "2", segmentIndex: 1, text: "private" }]).mockResolvedValueOnce([]);
    const provider = { embedDocuments: vi.fn(async (_texts: string[], _signal: AbortSignal | undefined, onAttempt: (result: { attempt: number; durationMs: number; success: boolean }) => Promise<void>) => { await onAttempt({ attempt: 1, durationMs: 12, success: true }); return [{ vector: [1], model: "gemini-embedding-001" as const, dimensions: 1 }]; }), embedQuery: vi.fn() };
    await new EmbeddingService(provider).embedBookSegments("book", "user-1");
    expect(mocks.usage).toHaveBeenCalledWith(expect.objectContaining({ generationId: "embedding:book", userId: "user-1", operation: "EMBEDDING", providerCallNumber: 101, success: true }));
    expect(mocks.usage.mock.calls[0][0]).not.toHaveProperty("text");
  });
  it("records retry and failure attempts with distinct idempotent attempt numbers", async () => {
    mocks.page.mockResolvedValueOnce([{ id: "2", segmentIndex: 1, text: "private" }]).mockResolvedValueOnce([]);
    const provider = { embedDocuments: vi.fn(async (_texts: string[], _signal: AbortSignal | undefined, onAttempt: (result: { attempt: number; durationMs: number; success: boolean; errorClassification?: string }) => Promise<void>) => { await onAttempt({ attempt: 1, durationMs: 3, success: false, errorClassification: "TRANSIENT" }); await onAttempt({ attempt: 2, durationMs: 8, success: true }); return [{ vector: [1], model: "gemini-embedding-001" as const, dimensions: 1 }]; }), embedQuery: vi.fn() };
    await new EmbeddingService(provider).embedBookSegments("book", "user-1");
    expect(mocks.usage).toHaveBeenNthCalledWith(1, expect.objectContaining({ providerCallNumber: 101, retryCount: 0, success: false }));
    expect(mocks.usage).toHaveBeenNthCalledWith(2, expect.objectContaining({ providerCallNumber: 102, retryCount: 1, success: true }));
  });
});
