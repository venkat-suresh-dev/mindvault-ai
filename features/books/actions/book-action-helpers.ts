import "server-only";

import { isBookDomainError, UnauthorizedBookAccessError } from "@/features/books/errors/book-errors";
import { EmbeddingGenerationError } from "@/lib/ai/embeddings";
import { actionFailure, type ActionResult } from "@/lib/db/action-result";
import { toDatabaseError } from "@/lib/db/errors";
import { auth } from "@clerk/nextjs/server";

export async function requireAuthenticatedBookUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedBookAccessError("Sign in to access your personal AI library.");
  }
  return userId;
}

export function toBookActionFailure(error: unknown): ActionResult<never> {
  if (error instanceof EmbeddingGenerationError) {
    return actionFailure("EMBEDDING_GENERATION_ERROR", error.message);
  }

  if (isBookDomainError(error)) {
    switch (error.code) {
      case "DUPLICATE_BOOK":
        return actionFailure("DUPLICATE_BOOK", error.message);
      case "DUPLICATE_SEGMENTS":
        return actionFailure("DUPLICATE_SEGMENTS", error.message);
      case "BOOK_NOT_FOUND":
        return actionFailure("NOT_FOUND", error.message);
      case "UNAUTHORIZED_BOOK_ACCESS":
        return actionFailure("UNAUTHORIZED", error.message);
      case "VALIDATION_ERROR":
        return actionFailure("VALIDATION_ERROR", error.message);
      case "PDF_PROCESSING_ERROR":
        return actionFailure("PDF_PROCESSING_ERROR", error.message);
      case "STORAGE_ERROR":
        return actionFailure("STORAGE_ERROR", error.message);
    }
  }

  return actionFailure("DATABASE_ERROR", toDatabaseError(error).message);
}
