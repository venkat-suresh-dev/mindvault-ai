import {
  BookNotFoundError,
  BookValidationError,
  BookStorageCleanupPendingError,
  DuplicateBookError,
  DuplicateBookSegmentsError,
} from "@/features/books/errors/book-errors";
import {
  deleteBookAndSegmentsForUser,
  findBookByIdForUser,
  findBooksForUser,
  findBookBySlugForUser,
  insertBook,
  updateBookSegmentCount,
  type BookWriteContext,
} from "@/features/books/repositories/book.repository";
import { findBookEmbeddingSummary, insertBookSegments } from "@/features/books/repositories/book-segment.repository";
import { type StorageProvider, VercelBlobStorage } from "@/features/books/services/storage";
import { generateSlug } from "@/features/books/utils/generate-slug";
import { normalizeBookTitle } from "@/features/books/utils/normalize-book-title";
import type { BookSegmentInput, CreateBookInput } from "@/features/books/types/book";
import { MongoServerError } from "mongodb";
import { deleteKnowledgeArtifactsForBook } from "@/features/knowledge/repositories/knowledge-artifact.repository";

const MAX_SLUG_ATTEMPTS = 100;

export async function createBookForUser(clerkId: string, input: CreateBookInput, context: BookWriteContext = {}) {
  const normalizedTitle = normalizeBookTitle(input.title);
  const baseSlug = generateSlug(input.title);
  if (!normalizedTitle || !baseSlug) {
    throw new BookValidationError("The title must contain at least one letter or number.");
  }

  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
    const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;

    try {
      return await insertBook({ ...input, clerkId, normalizedTitle, slug }, context);
    } catch (error) {
      if (isDuplicateKeyFor(error, "normalizedTitle")) throw new DuplicateBookError();
      if (isDuplicateKeyFor(error, "slug")) continue;
      throw error;
    }
  }

  throw new BookValidationError("A unique URL could not be assigned to this book.");
}

export async function getBookForUser(bookId: string, clerkId: string) {
  const book = await findBookByIdForUser(bookId, clerkId);
  if (!book) throw new BookNotFoundError();
  return book;
}

export async function getBookBySlugForUser(slug: string, clerkId: string) {
  const book = await findBookBySlugForUser(slug, clerkId);
  if (!book) throw new BookNotFoundError();
  return book;
}

export async function getBookDetailsBySlugForUser(slug: string, clerkId: string) {
  const book = await getBookBySlugForUser(slug, clerkId);
  const embedding = await findBookEmbeddingSummary(book._id.toString());
  return { ...book, embedding };
}

export async function getBooksForUser(clerkId: string) {
  return findBooksForUser(clerkId);
}

export async function deleteBookForUser(
  bookId: string,
  clerkId: string,
  storage: StorageProvider = new VercelBlobStorage(),
): Promise<void> {
  const book = await getBookForUser(bookId, clerkId);
  if (book.processingStatus !== "READY" && book.processingStatus !== "FAILED") {
    throw new BookValidationError("Books can only be deleted after processing has finished.");
  }

  const storageKeys = [book.fileBlobKey, book.coverBlobKey].filter((key): key is string => Boolean(key));
  const deleted = await deleteBookAndSegmentsForUser(bookId, clerkId);
  if (!deleted) throw new BookNotFoundError();
  await deleteKnowledgeArtifactsForBook(bookId, clerkId);

  const cleanup = await Promise.allSettled(storageKeys.map((key) => storage.delete(key)));
  if (cleanup.some((result) => result.status === "rejected")) throw new BookStorageCleanupPendingError();
}

export async function saveBookSegmentsForUser(
  bookId: string,
  clerkId: string,
  segments: BookSegmentInput[],
  context: BookWriteContext = {},
) {
  await getBookForUser(bookId, clerkId);

  const segmentIndexes = new Set(segments.map((segment) => segment.segmentIndex));
  if (segmentIndexes.size !== segments.length) {
    throw new BookValidationError("Each segment index must be unique within the request.");
  }

  try {
    await insertBookSegments(segments.map((segment) => ({ ...segment, bookId })), context.session);
  } catch (error) {
    if (isDuplicateKeyFor(error, "segmentIndex")) throw new DuplicateBookSegmentsError();
    throw error;
  }

  const highestSegmentIndex = Math.max(...segments.map((segment) => segment.segmentIndex));
  await updateBookSegmentCount(bookId, highestSegmentIndex + 1, context);
  return { insertedCount: segments.length };
}

function isDuplicateKeyFor(error: unknown, field: string): boolean {
  return error instanceof MongoServerError && error.code === 11000 && error.keyPattern?.[field] === 1;
}
