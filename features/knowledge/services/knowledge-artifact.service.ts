import "server-only";
import { findOrderedBookSegments } from "@/features/books/repositories/book-segment.repository";
import { getBookForUser } from "@/features/books/services/book.service";
import { ContextBuilderService } from "@/features/chat/services/context-builder.service";
import { createChatProvider } from "@/lib/ai/generation";
import { aiConfig } from "@/lib/config/ai.config";
import type { KnowledgeCitation } from "@/features/knowledge/types/knowledge";

export interface GroundingBatch { context: string; citations: KnowledgeCitation[] }
export interface GroundingProgressCallbacks { onSegmentsLoaded: () => Promise<void>; onBatchPrepared: (completedBatches: number, totalBatches: number) => Promise<void> }

export class KnowledgeArtifactService {
  private readonly contextBuilder = new ContextBuilderService();
  protected readonly provider = createChatProvider();

  public async getGrounding(bookId: string, clerkId: string, callbacks: GroundingProgressCallbacks): Promise<GroundingBatch[]> {
    await getBookForUser(bookId, clerkId);
    const segments = await findOrderedBookSegments(bookId);
    if (segments.length === 0) throw new Error("This book has no processed segments yet.");
    const batches: GroundingBatch[] = [];
    const totalBatches = Math.ceil(segments.length / aiConfig.knowledge.batchSegmentCount);
    await callbacks.onSegmentsLoaded();
    for (let start = 0; start < segments.length; start += aiConfig.knowledge.batchSegmentCount) {
      const current = segments.slice(start, start + aiConfig.knowledge.batchSegmentCount);
      const retrieval = { segments: current.map((segment) => ({ ...segment, score: 1 })), citations: current.map((segment) => ({ page: segment.pageNumber, segmentId: segment.id })) };
      const built = this.contextBuilder.build(retrieval, "Create a grounded learning artifact.");
      batches.push({ context: built.text.slice(0, aiConfig.knowledge.maxBatchContextTokens * 4), citations: built.citations.map((citation) => ({ segmentId: citation.segmentId, pageNumber: citation.page })) });
      await callbacks.onBatchPrepared(batches.length, totalBatches);
    }
    return batches;
  }

  protected async summarizeBatches(batches: GroundingBatch[], onProgress?: (completedBatches: number, totalBatches: number) => Promise<void>): Promise<string> {
    const summaries: string[] = [];
    for (const [index, batch] of batches.entries()) {
      summaries.push(await this.provider.generate({ prompt: `Summarize this book excerpt using only its context. Preserve its important concepts and arguments. Do not add facts.\n\n${batch.context}` }));
      await onProgress?.(index + 1, batches.length);
    }
    return summaries.join("\n\n").slice(0, aiConfig.knowledge.maxIntermediateTokens * 4);
  }

  protected citationsFor(batches: GroundingBatch[]): KnowledgeCitation[] {
    return batches.flatMap((batch) => batch.citations).filter((citation, index, all) => all.findIndex((candidate) => candidate.segmentId === citation.segmentId) === index);
  }
}
