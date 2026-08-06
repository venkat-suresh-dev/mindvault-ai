import { AiUsageModel } from "@/features/knowledge/models/ai-usage.model";
import type { KnowledgeArtifactType } from "@/features/knowledge/types/knowledge";
import { connectToDatabase } from "@/lib/db/connection";

export async function recordAiUsage(input: { generationId: string; userId: string; bookId: string; artifactType?: KnowledgeArtifactType; provider: string; model: string; operation: "GENERATION" | "EMBEDDING"; durationMs: number; success: boolean; errorClassification?: string; retryCount: number; providerCallNumber: number; inputTokens?: number; outputTokens?: number; estimatedCost?: number }): Promise<void> {
  await connectToDatabase();
  const idempotencyKey = `${input.generationId}:${input.operation}:${input.providerCallNumber}`;
  await AiUsageModel.updateOne({ idempotencyKey }, { $setOnInsert: { ...input, idempotencyKey } }, { upsert: true });
}

export async function deleteAiUsageForBook(bookId: string, userId: string): Promise<void> {
  await connectToDatabase();
  await AiUsageModel.deleteMany({ bookId, userId });
}
