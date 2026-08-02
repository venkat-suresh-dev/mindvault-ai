"use server";

import { getBookBySlugForUser } from "@/features/books/services/book.service";
import { BookValidationError } from "@/features/books/errors/book-errors";
import type { BookActionResult, BookRecord } from "@/features/books/types/book";
import { generateSlug } from "@/features/books/utils/generate-slug";
import { bookSlugSchema } from "@/features/books/validation/book.validation";
import { serialize } from "@/lib/db/serialize";
import { requireAuthenticatedBookUser, toBookActionFailure } from "./book-action-helpers";

export async function findBookBySlug(slug: string): Promise<BookActionResult<BookRecord>> {
  try {
    const clerkId = await requireAuthenticatedBookUser();
    const validation = bookSlugSchema.safeParse(slug);
    const normalizedSlug = validation.success ? generateSlug(validation.data) : "";
    if (!normalizedSlug) return toBookActionFailure(new BookValidationError("The book slug is invalid."));

    const book = await getBookBySlugForUser(normalizedSlug, clerkId);
    return { success: true, message: "Book retrieved.", data: serialize(book) };
  } catch (error) {
    return toBookActionFailure(error);
  }
}
