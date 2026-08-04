import "server-only";

import { createEmbeddingProvider, type EmbeddingProvider } from "@/lib/ai/embeddings";

export class EmbeddingSearchService {
  public constructor(private readonly provider: EmbeddingProvider = createEmbeddingProvider()) {}

  public async embedQuestion(question: string): Promise<number[]> {
    return (await this.provider.embedQuery(question)).vector;
  }
}
