import { BookSegmentModel } from "@/features/books/models/book-segment.model";
import type { GeneratedEmbedding } from "@/lib/ai/embeddings";
import { connectToDatabase } from "@/lib/db/connection";
import type { ClientSession } from "mongoose";

interface BookSegmentInsert {
  bookId: string;
  segmentIndex: number;
  pageNumber: number;
  text: string;
  wordCount: number;
  characterCount: number;
}

export interface PersistedBookSegment {
  id: string;
  text: string;
}

export interface BookSegmentEmbeddingUpdate {
  segmentId: string;
  embedding: GeneratedEmbedding;
}

export async function insertBookSegments(segments: BookSegmentInsert[], session?: ClientSession) {
  await connectToDatabase();
  return BookSegmentModel.insertMany(segments, { ordered: true, session });
}

export async function deleteBookSegments(bookId: string, session?: ClientSession) {
  await connectToDatabase();
  return BookSegmentModel.deleteMany({ bookId }, { session });
}

export interface BookEmbeddingSummary {
  model?: string;
  dimensions?: number;
}

export async function findBookEmbeddingSummary(bookId: string): Promise<BookEmbeddingSummary> {
  await connectToDatabase();
  const segment = await BookSegmentModel.findOne({ bookId, embeddingModel: { $exists: true } })
    .select({ embeddingModel: 1, embeddingDimensions: 1 })
    .lean();
  return { model: segment?.embeddingModel ?? undefined, dimensions: segment?.embeddingDimensions ?? undefined };
}

export async function findBookSegmentsWithoutEmbeddings(bookId: string): Promise<PersistedBookSegment[]> {
  await connectToDatabase();
  const segments = await BookSegmentModel.find({ bookId, embedding: { $exists: false } })
    .select({ _id: 1, text: 1 })
    .sort({ segmentIndex: 1 })
    .lean();

  return segments.map((segment) => ({ id: segment._id.toString(), text: segment.text }));
}

export async function bulkUpdateBookSegmentEmbeddings(updates: BookSegmentEmbeddingUpdate[]): Promise<void> {
  if (updates.length === 0) return;
  await connectToDatabase();
  const embeddedAt = new Date();
  await BookSegmentModel.bulkWrite(
    updates.map(({ segmentId, embedding }) => ({
      updateOne: {
        filter: { _id: segmentId },
        update: {
          $set: {
            embedding: embedding.vector,
            embeddingModel: embedding.model,
            embeddingDimensions: embedding.dimensions,
            embeddedAt,
          },
        },
      },
    })),
    { ordered: true },
  );
}
