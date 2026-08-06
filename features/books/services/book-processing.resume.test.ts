import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getBook: vi.fn(), save: vi.fn(), status: vi.fn(), embed: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/features/books/errors/book-errors", () => ({ BookValidationError: class extends Error {} }));
vi.mock("@/features/books/repositories/book-segment.repository", () => ({ deleteBookSegments: vi.fn() }));
vi.mock("@/features/books/services/chunk.service", () => ({ ChunkAccumulator: class { public push = () => []; public finish = () => [{ segmentIndex: 2, pageNumber: 2, text: "five", wordCount: 1, characterCount: 4 }]; } }));
vi.mock("@/features/books/services/storage", () => ({ VercelBlobStorage: class {} }));
vi.mock("@/features/books/services/embedding.service", () => ({ EmbeddingService: class {} }));
vi.mock("@/features/books/services/pdf.service", () => ({ PdfService: class {} }));
vi.mock("@/lib/config/ai.config", () => ({ aiConfig: { embeddings: { batchSize: 10 } } }));
vi.mock("@/lib/db/serialize", () => ({ serialize: vi.fn() }));
vi.mock("@/features/books/services/book.service", () => ({ getBookForUser: mocks.getBook, saveBookSegmentsForUser: mocks.save, createBookForUser: vi.fn() }));
vi.mock("@/features/books/repositories/book.repository", () => ({ updateBookProcessingStatus: mocks.status }));
vi.mock("@/features/jobs/services/job.service", () => ({ JobService: class {} }));

import { BookProcessingService } from "./book-processing.service";

describe("BookProcessingService checkpoint restart", () => {
  it("resumes at the next page and segment index without recreating persisted chunks", async () => {
    mocks.getBook.mockResolvedValue({ fileBlobKey: "private", totalSegments: 0 });
    const starts: number[] = [];
    const pdf = { extractPages: vi.fn(async (_file: File, onPages: (pages: { pageNumber: number; text: string }[]) => Promise<void>, _size: number, start: number) => { starts.push(start); await onPages([{ pageNumber: start, text: "one two three four five" }]); return { pageCount: 3 }; }) };
    const storage = { downloadPdf: vi.fn().mockResolvedValue(new File([], "book.pdf")) };
    const embeddings = { embedBookSegments: mocks.embed };
    const checkpoints: unknown[] = [];
    const service = new BookProcessingService(storage as never, pdf as never, embeddings as never);
    await service.processStored("book", "user", async () => undefined, new AbortController().signal, { lastProcessedPage: 1, nextSegmentIndex: 2, completedBatches: 1 }, async (checkpoint) => { checkpoints.push(checkpoint); });
    expect(starts).toEqual([2]);
    expect(mocks.save.mock.calls.flatMap((call) => call[2]).map((segment: { segmentIndex: number }) => segment.segmentIndex)).toEqual([2]);
    expect(checkpoints.some((value) => typeof value === "object" && value !== null && "lastProcessedPage" in value)).toBe(true);
    expect(mocks.embed).toHaveBeenCalledOnce();
  });
});
