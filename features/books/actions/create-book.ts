"use server";

import { BookValidationError } from "@/features/books/errors/book-errors";
import { BookProcessingService } from "@/features/books/services/book-processing.service";
import type { BookActionResult, BookRecord } from "@/features/books/types/book";
import { processBookUploadSchema } from "@/features/books/validation/book.validation";
import { requireAuthenticatedBookUser, toBookActionFailure } from "./book-action-helpers";

export async function createBook(formData: FormData): Promise<BookActionResult<BookRecord>> {
  try {
    const clerkId = await requireAuthenticatedBookUser();
    const validation = processBookUploadSchema.safeParse({
      title: readText(formData, "title"),
      author: readText(formData, "author"),
      persona: readText(formData, "voicePersona") || readText(formData, "persona"),
      pdfFile: formData.get("pdfFile"),
      coverImage: formData.get("coverImage") ?? undefined,
    });
    if (!validation.success) {
      throw new BookValidationError("Provide a valid PDF, optional cover image, and book details.");
    }

    const book = await new BookProcessingService().process(clerkId, validation.data);
    return { success: true, message: "Book prepared for AI retrieval.", data: book };
  } catch (error) {
    return toBookActionFailure(error);
  }
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}
