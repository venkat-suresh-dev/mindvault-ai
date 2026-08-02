import { BookSegmentModel } from "@/features/books/models/book-segment.model";
import { connectToDatabase } from "@/lib/db/connection";
import type { ClientSession } from "mongoose";

interface BookSegmentInsert {
  bookId: string;
  segmentIndex: number;
  pageNumber: number;
  text: string;
  tokenCount: number;
}

export async function insertBookSegments(segments: BookSegmentInsert[], session?: ClientSession) {
  await connectToDatabase();
  return BookSegmentModel.insertMany(segments, { ordered: true, session });
}
