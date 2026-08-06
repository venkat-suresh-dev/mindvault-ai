import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ books: vi.fn(), artifacts: vi.fn(), bookJob: vi.fn(), knowledgeJob: vi.fn(), log: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/config/job.config", () => ({ jobConfig: { reconciliationStaleMs: 1_000 } }));
vi.mock("@/features/books/repositories/book.repository", () => ({ findStaleBooksForReconciliation: mocks.books }));
vi.mock("@/features/knowledge/repositories/knowledge-artifact.repository", () => ({ findStaleKnowledgeArtifactsForReconciliation: mocks.artifacts }));
vi.mock("@/features/jobs/services/job.service", () => ({ JobService: class { enqueueBookProcessing = mocks.bookJob; enqueueKnowledgeGeneration = mocks.knowledgeJob; } }));
vi.mock("@/lib/observability/logger", () => ({ log: mocks.log }));

import { LegacyReconciliationService } from "./legacy-reconciliation.service";

describe("LegacyReconciliationService", () => {
  it("uses stable, distinct recovery keys and is safe to repeat", async () => {
    const updatedAt = new Date("2026-01-01T00:00:00.000Z");
    mocks.books.mockResolvedValue([{ _id: { toString: () => "book-1" }, clerkId: "user", processingStatus: "PROCESSING", fileBlobKey: "private", updatedAt }]);
    mocks.artifacts.mockResolvedValue([{ _id: { toString: () => "artifact-1" }, bookId: { toString: () => "book-1" }, clerkId: "user", type: "SUMMARY", generationId: "generation-1" }]);
    const service = new LegacyReconciliationService();
    await service.reconcile(updatedAt); await service.reconcile(updatedAt);
    expect(mocks.bookJob.mock.calls[0][2]).toBe("recovery:book:book-1:2026-01-01T00:00:00.000Z");
    expect(mocks.bookJob.mock.calls[1][2]).toBe(mocks.bookJob.mock.calls[0][2]);
    expect(mocks.knowledgeJob.mock.calls[0][0].recoveryKey).toBe("recovery:knowledge:artifact-1:generation-1");
  });
});
