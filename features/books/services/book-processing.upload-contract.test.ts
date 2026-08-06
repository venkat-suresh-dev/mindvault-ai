import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), enqueue: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/features/books/services/book.service", () => ({ createBookForUser: mocks.create, getBookForUser: vi.fn(), saveBookSegmentsForUser: vi.fn() }));
vi.mock("@/features/jobs/services/job.service", () => ({ JobService: class { enqueueBookProcessing = mocks.enqueue; } }));
vi.mock("@/features/books/services/storage", () => ({ VercelBlobStorage: class {} }));
vi.mock("@/features/books/services/pdf.service", () => ({ PdfService: class {} }));
vi.mock("@/features/books/services/embedding.service", () => ({ EmbeddingService: class {} }));
vi.mock("@/features/books/services/chunk.service", () => ({ ChunkAccumulator: class {} }));
vi.mock("@/features/books/repositories/book-segment.repository", () => ({ deleteBookSegments: vi.fn() }));
vi.mock("@/features/books/repositories/book.repository", () => ({ updateBookProcessingStatus: vi.fn() }));
vi.mock("@/features/books/errors/book-errors", () => ({ BookValidationError: class extends Error {} }));
vi.mock("@/lib/db/serialize", () => ({ serialize: (value: unknown) => value }));
vi.mock("@/lib/config/ai.config", () => ({ aiConfig: { embeddings: { batchSize: 2 } } }));

import { BookProcessingService } from "./book-processing.service";

describe("private Blob ownership", () => {
  beforeEach(() => vi.clearAllMocks());
  it("accepts the authenticated user's Blob and enqueues processing", async () => {
    mocks.create.mockResolvedValue({ _id: { toString: () => "book-1" } });
    await new BookProcessingService().queueUploadedPdf("user-1", { title: "Book", author: "Author", persona: "wise-professor", pdfUpload: { key: "books/user-1-file.pdf", url: "https://blob.example/private", size: 2_000_000 } });
    expect(mocks.create).toHaveBeenCalled(); expect(mocks.enqueue).toHaveBeenCalledWith("book-1", "user-1");
  });
  it("rejects another user's Blob before creating a book or job", async () => {
    await expect(new BookProcessingService().queueUploadedPdf("user-1", { title: "Book", author: "Author", persona: "wise-professor", pdfUpload: { key: "books/user-2-file.pdf", url: "https://blob.example/private", size: 2_000_000 } })).rejects.toThrow();
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.enqueue).not.toHaveBeenCalled();
  });
});
