import "server-only";

import { findSimilarSegments } from "@/features/search/repositories/vector-search.repository";
import type { RetrievalResult } from "@/features/search/types/search";
import { aiConfig } from "@/lib/config/ai.config";
import { EmbeddingSearchService } from "./embedding-search.service";
import { IdentityReranker } from "./reranking/identity-reranker";
import type { SegmentReranker } from "./reranking/segment-reranker";

export class RetrievalService {
  public constructor(
    private readonly embeddingSearchService = new EmbeddingSearchService(),
    private readonly reranker: SegmentReranker = new IdentityReranker(),
  ) {}

  public async retrieve(bookId: string, question: string): Promise<RetrievalResult> {
    const queryVector = await this.embeddingSearchService.embedQuestion(question);
    const retrievedSegments = await findSimilarSegments(bookId, queryVector);
    const segments = (await this.reranker.rerank(question, retrievedSegments)).slice(0, aiConfig.retrieval.maxContextSegments);
    return { segments, citations: segments.map((segment) => ({ page: segment.pageNumber, segmentId: segment.id })) };
  }
}
