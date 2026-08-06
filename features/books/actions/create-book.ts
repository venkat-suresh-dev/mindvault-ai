"use server";

import { BookValidationError } from "@/features/books/errors/book-errors";
import { BookProcessingService } from "@/features/books/services/book-processing.service";
import type { BookActionResult, BookRecord } from "@/features/books/types/book";
import { uploadedPdfReferenceSchema } from "@/features/books/validation/book.validation";
import { requireAuthenticatedBookUser, toBookActionFailure } from "./book-action-helpers";
import { log, safeErrorMetadata } from "@/lib/observability/logger";
import { captureException } from "@/lib/observability/telemetry";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createRequestContext } from "@/lib/security/request-context";

export async function createBook(input: { title: string; author: string; persona: string; pdfUpload: { pathname: string; url: string; size: number } }): Promise<BookActionResult<BookRecord>> {
  try {
    const clerkId = await requireAuthenticatedBookUser();
    const requestContext = await createRequestContext(clerkId);
    const rateLimit = await enforceRateLimit("upload", requestContext);
    if (!rateLimit.allowed) {
      throw new BookValidationError(`Too many upload attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.`);
    }
    const validation = uploadedPdfReferenceSchema.safeParse(input.pdfUpload);
    if (!validation.success) {
      throw new BookValidationError("Provide a valid PDF, optional cover image, and book details.");
    }

    const book = await new BookProcessingService().queueUploadedPdf(clerkId, { title: input.title, author: input.author, persona: input.persona, pdfUpload: { key: validation.data.pathname, url: validation.data.url, size: validation.data.size } });
    return { success: true, message: "Book processing has started.", data: book };
  } catch (error) {
    log("error", "book.upload.failed", safeErrorMetadata(error));
    await captureException(error, { operation: "book-upload" });
    return toBookActionFailure(error);
  }
}
