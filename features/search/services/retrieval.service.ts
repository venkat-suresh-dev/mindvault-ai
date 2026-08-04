import "server-only";

import { findSimilarSegments } from "@/features/search/repositories/vector-search.repository";
import type { RetrievalResult } from "@/features/search/types/search";
import { aiConfig } from "@/lib/config/ai.config";
import { EmbeddingSearchService } from "./embedding-search.service";

export class RetrievalService {
  public constructor(private readonly embeddingSearchService = new EmbeddingSearchService()) {}

  public async retrieve(bookId: string, question: string): Promise<RetrievalResult> {
    const queryVector = await this.embeddingSearchService.embedQuestion(question);
    const segments = (await findSimilarSegments(bookId, queryVector)).slice(0, aiConfig.retrieval.maxContextSegments);
    return { segments, citations: segments.map((segment) => ({ page: segment.pageNumber, segmentId: segment.id })) };
  }
}
