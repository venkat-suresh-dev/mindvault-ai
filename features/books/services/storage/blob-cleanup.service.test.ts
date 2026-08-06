import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ record: vi.fn(), remove: vi.fn() }));
vi.mock("@/features/books/repositories/blob-cleanup.repository", () => ({ recordBlobCleanupFailure: mocks.record, removeBlobCleanupRecord: mocks.remove }));
import { BlobCleanupService } from "./blob-cleanup.service";

describe("BlobCleanupService", () => {
  beforeEach(() => vi.clearAllMocks());
  it("removes a durable cleanup record after a successful idempotent delete", async () => {
    await new BlobCleanupService().delete("book", "user", "books/user-a.pdf", { delete: vi.fn(), uploadPdf: vi.fn(), uploadCover: vi.fn(), downloadPdf: vi.fn() });
    expect(mocks.remove).toHaveBeenCalledWith("book", "user", "books/user-a.pdf");
  });
  it("records a retry-safe cleanup request when deletion fails", async () => {
    await new BlobCleanupService().delete("book", "user", "books/user-a.pdf", { delete: vi.fn().mockRejectedValue(new Error("storage")), uploadPdf: vi.fn(), uploadCover: vi.fn(), downloadPdf: vi.fn() });
    expect(mocks.record).toHaveBeenCalledWith("book", "user", "books/user-a.pdf", "STORAGE_DELETE_FAILED");
  });
  it("is idempotent when a retry succeeds after a failure", async () => {
    const storage = { delete: vi.fn().mockRejectedValueOnce(new Error("storage")).mockResolvedValueOnce(undefined), uploadPdf: vi.fn(), uploadCover: vi.fn(), downloadPdf: vi.fn() };
    const service = new BlobCleanupService();
    await service.delete("book", "user", "books/user-a.pdf", storage);
    await service.delete("book", "user", "books/user-a.pdf", storage);
    expect(mocks.record).toHaveBeenCalledOnce();
    expect(mocks.remove).toHaveBeenCalledWith("book", "user", "books/user-a.pdf");
  });
});
