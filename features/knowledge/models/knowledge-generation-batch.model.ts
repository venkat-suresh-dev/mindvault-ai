import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { KNOWLEDGE_ARTIFACT_TYPES } from "@/features/knowledge/types/knowledge";

const knowledgeGenerationBatchSchema = new Schema(
  {
    artifactId: { type: Schema.Types.ObjectId, required: true, ref: "KnowledgeArtifact", index: true },
    bookId: { type: Schema.Types.ObjectId, required: true, ref: "Book", index: true },
    clerkId: { type: String, required: true, index: true },
    artifactType: { type: String, enum: KNOWLEDGE_ARTIFACT_TYPES, required: true },
    generationId: { type: String, required: true },
    batchIndex: { type: Number, required: true, min: 0 },
    summary: { type: String, required: true },
  },
  { timestamps: true },
);

knowledgeGenerationBatchSchema.index(
  { clerkId: 1, bookId: 1, artifactType: 1, generationId: 1, batchIndex: 1 },
  { unique: true },
);
knowledgeGenerationBatchSchema.index({ artifactId: 1, generationId: 1, batchIndex: 1 }, { unique: true });

export type KnowledgeGenerationBatchDocument = InferSchemaType<typeof knowledgeGenerationBatchSchema>;
export const KnowledgeGenerationBatchModel: Model<KnowledgeGenerationBatchDocument> =
  (models.KnowledgeGenerationBatch as Model<KnowledgeGenerationBatchDocument> | undefined) ??
  model<KnowledgeGenerationBatchDocument>("KnowledgeGenerationBatch", knowledgeGenerationBatchSchema);
