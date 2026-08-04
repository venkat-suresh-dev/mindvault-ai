import "server-only";

import type { RetrievalResult } from "@/features/search/types/search";

export interface BuiltContext {
  text: string;
  citations: RetrievalResult["citations"];
}

export class ContextBuilderService {
  public build(retrieval: RetrievalResult): BuiltContext {
    const segments = [...retrieval.segments]
      .sort((left, right) => left.segmentIndex - right.segmentIndex)
      .filter((segment, index, all) => all.findIndex((candidate) => candidate.id === segment.id) === index);
    return {
      text: segments.map((segment) => `[Segment ${segment.id}; page ${segment.pageNumber}]\n${segment.text}`).join("\n\n"),
      citations: segments.map((segment) => ({ page: segment.pageNumber, segmentId: segment.id })),
    };
  }
}
