import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), rate: vi.fn(), queue: vi.fn(), log: vi.fn(), capture: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/embeddings", () => ({ EmbeddingGenerationError: class extends Error {} }));
vi.mock("@/lib/db/action-result", () => ({ actionFailure: (_code: string, message: string) => ({ success: false, message }) }));
vi.mock("@/lib/db/errors", () => ({ toDatabaseError: (error: unknown) => ({ message: error instanceof Error ? error.message : "Unknown error" }) }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ userId: "user-1" }) }));
vi.mock("@/features/books/actions/book-action-helpers", () => ({ requireAuthenticatedBookUser: mocks.auth, toBookActionFailure: (error: Error) => ({ success: false, message: error.message }) }));
vi.mock("@/lib/security/request-context", () => ({ createRequestContext: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/security/rate-limit", () => ({ enforceRateLimit: mocks.rate }));
vi.mock("@/features/books/services/book-processing.service", () => ({ BookProcessingService: class { queueUploadedPdf = mocks.queue; } }));
vi.mock("@/lib/observability/logger", () => ({ log: mocks.log, safeErrorMetadata: () => ({}) }));
vi.mock("@/lib/observability/telemetry", () => ({ captureException: mocks.capture }));
vi.mock("@/features/books/errors/book-errors", () => ({ BookValidationError: class extends Error {}, isBookDomainError: () => false }));
vi.mock("@/features/books/validation/book.validation", () => ({ uploadedPdfReferenceSchema: { safeParse: (value: unknown) => ({ success: true, data: value }) } }));

import { createBook } from "./create-book";

describe("createBook direct Blob contract", () => {
  beforeEach(() => vi.clearAllMocks());
  it("accepts only private Blob metadata for a PDF larger than the Server Action limit", async () => {
    mocks.auth.mockResolvedValue("user-1"); mocks.rate.mockResolvedValue({ allowed: true }); mocks.queue.mockResolvedValue({ id: "book-1" });
    const result = await createBook({ title: "Large book", author: "Author", persona: "wise-professor", pdfUpload: { pathname: "books/user-1-random.pdf", url: "https://blob.example/private", size: 5 * 1024 * 1024 } });
    expect(result.success).toBe(true);
    expect(mocks.queue).toHaveBeenCalledWith("user-1", expect.objectContaining({ pdfUpload: expect.objectContaining({ key: "books/user-1-random.pdf", size: 5 * 1024 * 1024 }) }));
    expect(JSON.stringify(mocks.queue.mock.calls[0][1])).not.toContain("pdfFile");
  });
});
