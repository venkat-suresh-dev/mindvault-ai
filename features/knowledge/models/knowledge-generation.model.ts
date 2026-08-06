import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { KNOWLEDGE_ARTIFACT_TYPES, KNOWLEDGE_GENERATION_STAGES } from "@/features/knowledge/types/knowledge";

export const KNOWLEDGE_GENERATION_STATUSES = ["QUEUED", "PROCESSING", "RETRYING", "CANCEL_REQUESTED", "CANCELLED", "COMPLETED", "FAILED"] as const;

const knowledgeGenerationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  bookId: { type: Schema.Types.ObjectId, required: true, ref: "Book", index: true },
  artifactId: { type: Schema.Types.ObjectId, required: true, ref: "KnowledgeArtifact", index: true },
  artifactType: { type: String, enum: KNOWLEDGE_ARTIFACT_TYPES, required: true },
  generationId: { type: String, required: true },
  durableJobId: { type: Schema.Types.ObjectId, ref: "DurableJob" },
  status: { type: String, enum: KNOWLEDGE_GENERATION_STATUSES, required: true, default: "QUEUED" },
  progress: { type: Number, required: true, min: 0, max: 100, default: 0 },
  generationStage: { type: String, enum: KNOWLEDGE_GENERATION_STAGES },
  currentBatch: { type: Number, min: 0 },
  totalBatches: { type: Number, min: 0 },
  startedAt: Date,
  completedAt: Date,
  failedAt: Date,
  lastProgressAt: Date,
  errorMessage: String,
  errorClassification: String,
}, { timestamps: true });

knowledgeGenerationSchema.index({ userId: 1, bookId: 1, artifactType: 1, generationId: 1 }, { unique: true });
knowledgeGenerationSchema.index(
  { userId: 1, bookId: 1, artifactType: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["QUEUED", "PROCESSING", "RETRYING", "CANCEL_REQUESTED"] } } },
);
export type KnowledgeGenerationDocument = InferSchemaType<typeof knowledgeGenerationSchema>;
export const KnowledgeGenerationModel: Model<KnowledgeGenerationDocument> = (models.KnowledgeGeneration as Model<KnowledgeGenerationDocument> | undefined) ?? model<KnowledgeGenerationDocument>("KnowledgeGeneration", knowledgeGenerationSchema);
