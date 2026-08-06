import { BookModel, type BookProcessingStatus } from "@/features/books/models/book.model";
import { BookSegmentModel } from "@/features/books/models/book-segment.model";
import type { BookRecord } from "@/features/books/types/book";
import { connectToDatabase } from "@/lib/db/connection";
import type { ClientSession } from "mongoose";

export interface BookWriteContext {
  session?: ClientSession;
}

interface CreateBookDocument {
  clerkId: string;
  title: string;
  normalizedTitle: string;
  slug: string;
  author: string;
  persona?: string;
  fileUrl?: string;
  fileBlobKey: string;
  coverUrl?: string;
  coverBlobKey?: string;
  fileSize: number;
}

export async function insertBook(input: CreateBookDocument, context: BookWriteContext = {}) {
  await connectToDatabase();
  const [book] = await BookModel.create([input], context);
  return book;
}

export async function findBookByIdForUser(bookId: string, clerkId: string) {
  await connectToDatabase();
  return BookModel.findOne({ _id: bookId, clerkId }).lean();
}

export async function findBookBySlugForUser(slug: string, clerkId: string) {
  await connectToDatabase();
  return BookModel.findOne({ slug, clerkId }).lean();
}

export async function findBooksForUser(clerkId: string): Promise<BookRecord[]> {
  await connectToDatabase();
  const books = await BookModel.find({ clerkId }).sort({ createdAt: -1 }).lean();

  return books.map((book) => ({
    id: book._id.toString(),
    clerkId: book.clerkId,
    title: book.title,
    normalizedTitle: book.normalizedTitle,
    slug: book.slug,
    author: book.author,
    persona: book.persona,
    fileUrl: book.fileUrl,
    fileBlobKey: book.fileBlobKey,
    coverUrl: book.coverUrl,
    coverBlobKey: book.coverBlobKey,
    fileSize: book.fileSize,
    totalSegments: book.totalSegments,
    processingStatus: book.processingStatus,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
  }));
}

export async function deleteBookByIdForUser(bookId: string, clerkId: string) {
  await connectToDatabase();
  return BookModel.deleteOne({ _id: bookId, clerkId });
}

export async function deleteBookAndSegmentsForUser(bookId: string, clerkId: string): Promise<boolean> {
  const connection = await connectToDatabase();
  const session = await connection.startSession();

  try {
    let deleted = false;
    await session.withTransaction(async () => {
      await BookSegmentModel.deleteMany({ bookId }, { session });
      const result = await BookModel.deleteOne({ _id: bookId, clerkId }, { session });
      deleted = result.deletedCount === 1;
      if (!deleted) throw new Error("Book deletion did not complete.");
    });
    return deleted;
  } finally {
    await session.endSession();
  }
}

export async function updateBookSegmentCount(bookId: string, totalSegments: number, context: BookWriteContext = {}) {
  await connectToDatabase();
  return BookModel.updateOne({ _id: bookId }, { $max: { totalSegments } }, context);
}

export async function updateBookProcessingStatus(
  bookId: string,
  processingStatus: BookProcessingStatus,
  context: BookWriteContext = {},
) {
  await connectToDatabase();
  return BookModel.updateOne({ _id: bookId }, { $set: { processingStatus } }, context);
}

export async function findStaleBooksForReconciliation(staleBefore: Date) {
  await connectToDatabase();
  return BookModel.find({ processingStatus: { $in: ["UPLOADING", "PROCESSING", "PROCESSING_EMBEDDINGS"] }, updatedAt: { $lt: staleBefore } })
    .select({ _id: 1, clerkId: 1, processingStatus: 1, totalSegments: 1, fileBlobKey: 1, updatedAt: 1 })
    .limit(100)
    .lean();
}
