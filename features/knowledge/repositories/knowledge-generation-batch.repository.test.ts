import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ connect: vi.fn(), updateOne: vi.fn() }));

vi.mock("@/lib/db/connection", () => ({ connectToDatabase: mocks.connect }));
vi.mock("@/features/knowledge/models/knowledge-generation-batch.model", () => ({
  KnowledgeGenerationBatchModel: { updateOne: mocks.updateOne },
}));

import { saveKnowledgeGenerationBatchSummary } from "./knowledge-generation-batch.repository";

describe("knowledge generation batch repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists each batch with an idempotent generation checkpoint key", async () => {
    mocks.updateOne.mockResolvedValue({ modifiedCount: 0, upsertedCount: 1 });

    await saveKnowledgeGenerationBatchSummary({
      artifactId: "artifact-1",
      bookId: "book-1",
      clerkId: "user-1",
      artifactType: "SUMMARY",
      generationId: "generation-1",
      batchIndex: 10,
      summary: "completed summary",
    });

    expect(mocks.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ artifactId: "artifact-1", generationId: "generation-1", batchIndex: 10 }),
      expect.objectContaining({ $setOnInsert: expect.objectContaining({ summary: "completed summary" }) }),
      { upsert: true },
    );
  });
});
