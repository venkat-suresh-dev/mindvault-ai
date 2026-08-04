"use server";

import { BookValidationError } from "@/features/books/errors/book-errors";
import { deleteBookForUser } from "@/features/books/services/book.service";
import type { BookActionResult } from "@/features/books/types/book";
import { bookIdSchema } from "@/features/books/validation/book.validation";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedBookUser, toBookActionFailure } from "./book-action-helpers";

export async function deleteBook(bookId: string): Promise<BookActionResult<undefined>> {
  try {
    const clerkId = await requireAuthenticatedBookUser();
    if (!bookIdSchema.safeParse(bookId).success) {
      throw new BookValidationError("The book ID is invalid.");
    }

    await deleteBookForUser(bookId, clerkId);
    revalidatePath("/");
    return { success: true, message: "Book deleted.", data: undefined };
  } catch (error) {
    return toBookActionFailure(error);
  }
}
