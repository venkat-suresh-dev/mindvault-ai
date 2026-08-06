import "server-only";

import { createEmbeddingProvider, EmbeddingGenerationError, type EmbeddingProvider } from "@/lib/ai/embeddings";
import { aiConfig } from "@/lib/config/ai.config";
import {
  bulkUpdateBookSegmentEmbeddings,
  findBookSegmentsWithoutEmbeddingsPage,
} from "@/features/books/repositories/book-segment.repository";
import { recordAiUsage } from "@/features/knowledge/repositories/ai-usage.repository";

// Future: enforce subscription limits, billing checks, and embedding usage quotas here.
export class EmbeddingService {
  public constructor(private readonly provider?: EmbeddingProvider) {}

  public async embedBookSegments(bookId: string, clerkId: string, options: { signal?: AbortSignal; assertLease?: () => Promise<void> } = {}): Promise<void> {
    const provider = this.getProvider();
    let afterSegmentIndex: number | undefined;
    while (true) {
      throwIfAborted(options.signal);
      await options.assertLease?.();
      const batch = await findBookSegmentsWithoutEmbeddingsPage(bookId, afterSegmentIndex, aiConfig.embeddings.batchSize);
      if (batch.length === 0) return;
      const providerCallNumber = batch[batch.length - 1].segmentIndex;
      const embeddings = await provider.embedDocuments(batch.map((segment) => segment.text), options.signal, async (attempt) => {
        await recordAiUsage({ generationId: `embedding:${bookId}`, userId: clerkId, bookId, provider: "gemini", model: aiConfig.embeddings.model, operation: "EMBEDDING", durationMs: attempt.durationMs, success: attempt.success, errorClassification: attempt.errorClassification, retryCount: attempt.attempt - 1, providerCallNumber: providerCallNumber * 100 + attempt.attempt });
      });
      if (embeddings.length !== batch.length) {
        throw new EmbeddingGenerationError("The embedding provider returned an incomplete batch.");
      }
      throwIfAborted(options.signal);
      await options.assertLease?.();
      await bulkUpdateBookSegmentEmbeddings(
        batch.map((segment, index) => ({ segmentId: segment.id, embedding: embeddings[index] })),
      );
      afterSegmentIndex = batch[batch.length - 1].segmentIndex;
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

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new DOMException("Embedding job was cancelled.", "AbortError");
}
