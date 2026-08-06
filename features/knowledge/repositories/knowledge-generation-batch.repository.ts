import { KnowledgeGenerationBatchModel } from "@/features/knowledge/models/knowledge-generation-batch.model";
import { connectToDatabase } from "@/lib/db/connection";
import type { KnowledgeArtifactType } from "@/features/knowledge/types/knowledge";

export interface KnowledgeGenerationBatchSummary {
  batchIndex: number;
  summary: string;
}

export async function listKnowledgeGenerationBatchSummaries(
  artifactId: string,
  bookId: string,
  clerkId: string,
  artifactType: KnowledgeArtifactType,
  generationId: string,
): Promise<KnowledgeGenerationBatchSummary[]> {
  await connectToDatabase();
  const batches = await KnowledgeGenerationBatchModel.find({ artifactId, bookId, clerkId, artifactType, generationId })
    .select({ batchIndex: 1, summary: 1 })
    .sort({ batchIndex: 1 })
    .lean();
  return batches.map((batch) => ({ batchIndex: batch.batchIndex, summary: batch.summary }));
}

export async function saveKnowledgeGenerationBatchSummary(input: {
  artifactId: string;
  bookId: string;
  clerkId: string;
  artifactType: KnowledgeArtifactType;
  generationId: string;
  batchIndex: number;
  summary: string;
}): Promise<void> {
  await connectToDatabase();
  await KnowledgeGenerationBatchModel.updateOne(
    {
      artifactId: input.artifactId,
      bookId: input.bookId,
      clerkId: input.clerkId,
      artifactType: input.artifactType,
      generationId: input.generationId,
      batchIndex: input.batchIndex,
    },
    { $setOnInsert: input },
    { upsert: true },
  );
}

export async function deleteKnowledgeGenerationBatchesForBook(bookId: string, clerkId: string): Promise<void> {
  await connectToDatabase();
  await KnowledgeGenerationBatchModel.deleteMany({ bookId, clerkId });
}
