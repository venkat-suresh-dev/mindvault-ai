"use server";

import { saveBookSegmentsForUser } from "@/features/books/services/book.service";
import { BookValidationError } from "@/features/books/errors/book-errors";
import type { SaveBookSegmentsInput } from "@/features/books/types/book";
import { saveBookSegmentsSchema } from "@/features/books/validation/book.validation";
import { type ActionResult } from "@/lib/db/action-result";
import { requireAuthenticatedBookUser, toBookActionFailure } from "./book-action-helpers";

export async function saveBookSegments(input: SaveBookSegmentsInput): Promise<ActionResult<{ insertedCount: number }>> {
  try {
    const clerkId = await requireAuthenticatedBookUser();
    const validation = saveBookSegmentsSchema.safeParse(input);
    if (!validation.success) return toBookActionFailure(new BookValidationError("Provide valid book segments."));

    const data = await saveBookSegmentsForUser(validation.data.bookId, clerkId, validation.data.segments);
    return { success: true, message: "Book segments saved.", data };
  } catch (error) {
    return toBookActionFailure(error);
  }
}
