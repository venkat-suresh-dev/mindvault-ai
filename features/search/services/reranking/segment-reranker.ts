import type { RetrievedSegment } from "@/features/search/types/search";

export interface SegmentReranker {
  rerank(question: string, segments: RetrievedSegment[]): Promise<RetrievedSegment[]>;
}
