import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ connect: vi.fn(), updateOne: vi.fn() }));
vi.mock("@/lib/db/connection", () => ({ connectToDatabase: mocks.connect }));
vi.mock("@/features/knowledge/models/ai-usage.model", () => ({ AiUsageModel: { updateOne: mocks.updateOne } }));
import { recordAiUsage } from "./ai-usage.repository";

describe("recordAiUsage", () => {
  beforeEach(() => vi.clearAllMocks());
  it("writes an idempotent, non-sensitive usage event", async () => {
    await recordAiUsage({ generationId: "generation-1", userId: "user-1", bookId: "book-1", artifactType: "FLASHCARDS", provider: "gemini", model: "gemini-3.5-flash", operation: "GENERATION", durationMs: 20, success: false, errorClassification: "TIMEOUT", retryCount: 1, providerCallNumber: 4 });
    const [filter, update] = mocks.updateOne.mock.calls[0];
    expect(filter).toEqual({ idempotencyKey: "generation-1:GENERATION:4" });
    expect(update.$setOnInsert).not.toHaveProperty("prompt");
    expect(update.$setOnInsert).not.toHaveProperty("text");
    expect(update.$setOnInsert).not.toHaveProperty("embedding");
  });
});
