import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findOneAndUpdate: vi.fn(),
  connect: vi.fn(),
}));

vi.mock("@/features/knowledge/models/knowledge-artifact.model", () => ({
  KnowledgeArtifactModel: { findOneAndUpdate: mocks.findOneAndUpdate },
}));
vi.mock("@/lib/db/connection", () => ({ connectToDatabase: mocks.connect }));

import { prepareKnowledgeArtifactRegeneration } from "./knowledge-artifact.repository";

describe("prepareKnowledgeArtifactRegeneration", () => {
  it("only associates the new generation with completed content", async () => {
    const lean = vi.fn().mockResolvedValue({ _id: "artifact-1" });
    mocks.findOneAndUpdate.mockReturnValue({ lean });

    await prepareKnowledgeArtifactRegeneration("book-1", "user-1", "SUMMARY", "generation-next");

    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
      { bookId: "book-1", clerkId: "user-1", type: "SUMMARY", status: "COMPLETED" },
      { $set: { generationId: "generation-next" } },
      { returnDocument: "after" },
    );
  });
});
