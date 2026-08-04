import "server-only";

import { BookSegmentModel } from "@/features/books/models/book-segment.model";
import type { RetrievedSegment } from "@/features/search/types/search";
import { aiConfig } from "@/lib/config/ai.config";
import { connectToDatabase } from "@/lib/db/connection";
import { Types } from "mongoose";

interface VectorSearchRow {
  _id: Types.ObjectId;
  segmentIndex: number;
  pageNumber: number;
  text: string;
  score: number;
}

export async function findSimilarSegments(bookId: string, queryVector: number[]): Promise<RetrievedSegment[]> {
  await connectToDatabase();
  const rows = await BookSegmentModel.aggregate<VectorSearchRow>([
    {
      $vectorSearch: {
        index: aiConfig.retrieval.vectorIndexName,
        path: "embedding",
        queryVector,
        numCandidates: aiConfig.retrieval.numCandidates,
        limit: aiConfig.retrieval.topK,
        filter: { bookId: new Types.ObjectId(bookId) },
      },
    },
    { $project: { segmentIndex: 1, pageNumber: 1, text: 1, score: { $meta: "vectorSearchScore" } } },
    { $match: { score: { $gte: aiConfig.retrieval.minimumScore } } },
  ]);

  return rows.map((segment) => ({
    id: segment._id.toString(),
    segmentIndex: segment.segmentIndex,
    pageNumber: segment.pageNumber,
    text: segment.text,
    score: segment.score,
  }));
}
