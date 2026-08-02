import { BookModel } from "@/features/books/models/book.model";
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
  fileUrl: string;
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

export async function updateBookSegmentCount(bookId: string, totalSegments: number, context: BookWriteContext = {}) {
  await connectToDatabase();
  return BookModel.updateOne({ _id: bookId }, { $max: { totalSegments } }, context);
}
