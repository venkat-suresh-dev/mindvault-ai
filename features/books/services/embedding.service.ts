import "server-only";

import { createEmbeddingProvider, EmbeddingGenerationError, type EmbeddingProvider } from "@/lib/ai/embeddings";
import { aiConfig } from "@/lib/config/ai.config";
import {
  bulkUpdateBookSegmentEmbeddings,
  findBookSegmentsWithoutEmbeddings,
} from "@/features/books/repositories/book-segment.repository";

// Future: enforce subscription limits, billing checks, and embedding usage quotas here.
export class EmbeddingService {
  public constructor(private readonly provider?: EmbeddingProvider) {}

  public async embedBookSegments(bookId: string): Promise<void> {
    const segments = await findBookSegmentsWithoutEmbeddings(bookId);
    const provider = this.getProvider();

    for (let start = 0; start < segments.length; start += aiConfig.embeddings.batchSize) {
      const batch = segments.slice(start, start + aiConfig.embeddings.batchSize);
      const embeddings = await provider.embedDocuments(batch.map((segment) => segment.text));
      if (embeddings.length !== batch.length) {
        throw new EmbeddingGenerationError("The embedding provider returned an incomplete batch.");
      }

      await bulkUpdateBookSegmentEmbeddings(
        batch.map((segment, index) => ({ segmentId: segment.id, embedding: embeddings[index] })),
      );
    }
  }

  private getProvider(): EmbeddingProvider {
    try {
      return this.provider ?? createEmbeddingProvider();
    } catch (error) {
      throw new EmbeddingGenerationError("Embedding configuration is unavailable.", { cause: error });
    }
  }
}
