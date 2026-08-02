"use server";

import { getBookForUser } from "@/features/books/services/book.service";
import { BookValidationError } from "@/features/books/errors/book-errors";
import type { BookActionResult, BookRecord } from "@/features/books/types/book";
import { bookIdSchema } from "@/features/books/validation/book.validation";
import { serialize } from "@/lib/db/serialize";
import { requireAuthenticatedBookUser, toBookActionFailure } from "./book-action-helpers";

export async function getBook(bookId: string): Promise<BookActionResult<BookRecord>> {
  try {
    const clerkId = await requireAuthenticatedBookUser();
    if (!bookIdSchema.safeParse(bookId).success) {
      return toBookActionFailure(new BookValidationError("The book ID is invalid."));
    }

    const book = await getBookForUser(bookId, clerkId);
    return { success: true, message: "Book retrieved.", data: serialize(book) };
  } catch (error) {
    return toBookActionFailure(error);
  }
}
