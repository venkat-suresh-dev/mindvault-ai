"use server";

import { createBookForUser } from "@/features/books/services/book.service";
import { BookValidationError } from "@/features/books/errors/book-errors";
import type { BookActionResult, BookRecord, CreateBookInput } from "@/features/books/types/book";
import { createBookMetadataSchema } from "@/features/books/validation/book.validation";
import { serialize } from "@/lib/db/serialize";
import { requireAuthenticatedBookUser, toBookActionFailure } from "./book-action-helpers";

export async function createBook(input: CreateBookInput | FormData): Promise<BookActionResult<BookRecord>> {
  try {
    const clerkId = await requireAuthenticatedBookUser();
    const validation = createBookMetadataSchema.safeParse(toCreateBookInput(input));
    if (!validation.success) return toBookActionFailure(new BookValidationError("Provide valid uploaded file details before creating a book."));

    const book = await createBookForUser(clerkId, validation.data);
    return { success: true, message: "Book created.", data: serialize(book.toObject()) };
  } catch (error) {
    return toBookActionFailure(error);
  }
}

function toCreateBookInput(input: CreateBookInput | FormData): CreateBookInput {
  if (!(input instanceof FormData)) return input;

  return {
    title: readFormField(input, "title"),
    author: readFormField(input, "author"),
    persona: readFormField(input, "persona") || readFormField(input, "voicePersona") || undefined,
    fileUrl: readFormField(input, "fileUrl"),
    fileBlobKey: readFormField(input, "fileBlobKey"),
    coverUrl: readFormField(input, "coverUrl") || undefined,
    coverBlobKey: readFormField(input, "coverBlobKey") || undefined,
    fileSize: Number(readFormField(input, "fileSize")),
  };
}

function readFormField(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}
