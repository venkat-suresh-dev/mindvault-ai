import type { RetrievedSegment } from "@/features/search/types/search";
import type { SegmentReranker } from "./segment-reranker";

export class IdentityReranker implements SegmentReranker {
  public async rerank(_question: string, segments: RetrievedSegment[]): Promise<RetrievedSegment[]> {
    return segments;
  }
}
