import { describe, expect, it, vi } from "vitest";

const modelCalls = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/logger", () => ({ log: vi.fn() }));
vi.mock("@google/genai", () => ({ GoogleGenAI: class { public models = { embedContent: modelCalls }; } }));
vi.mock("@/lib/config/ai.config", () => ({ aiConfig: { gemini: { apiKey: "test" }, embeddings: { model: "embedding", dimensions: 2, timeoutMs: 10, maxRetries: 1, retryBaseDelayMs: 1 } } }));

import { GeminiEmbeddingProvider } from "./gemini-embedding-provider";

describe("GeminiEmbeddingProvider cancellation", () => {
  it("passes the caller AbortSignal to the provider boundary", async () => {
    modelCalls.mockResolvedValueOnce({ embeddings: [{ values: [1, 0] }] });
    const controller = new AbortController();
    await new GeminiEmbeddingProvider().embedDocuments(["safe input"], controller.signal);
    expect(modelCalls.mock.calls[0][0].config.abortSignal).toBeInstanceOf(AbortSignal);
    controller.abort();
    expect(modelCalls.mock.calls[0][0].config.abortSignal.aborted).toBe(true);
  });
});
