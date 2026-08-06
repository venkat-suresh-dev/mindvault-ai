import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { KNOWLEDGE_ARTIFACT_TYPES } from "@/features/knowledge/types/knowledge";

const aiUsageSchema = new Schema({
  idempotencyKey: { type: String, required: true },
  generationId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  bookId: { type: Schema.Types.ObjectId, required: true, ref: "Book", index: true },
  artifactType: { type: String, enum: KNOWLEDGE_ARTIFACT_TYPES },
  provider: { type: String, required: true },
  model: { type: String, required: true },
  operation: { type: String, enum: ["GENERATION", "EMBEDDING"], required: true },
  durationMs: { type: Number, required: true, min: 0 },
  success: { type: Boolean, required: true },
  errorClassification: String,
  retryCount: { type: Number, required: true, min: 0 },
  providerCallNumber: { type: Number, required: true, min: 0 },
  inputTokens: { type: Number, min: 0 },
  outputTokens: { type: Number, min: 0 },
  estimatedCost: { type: Number, min: 0 },
}, { timestamps: { createdAt: true, updatedAt: false } });

aiUsageSchema.index({ idempotencyKey: 1 }, { unique: true });
export type AiUsageDocument = InferSchemaType<typeof aiUsageSchema>;
export const AiUsageModel: Model<AiUsageDocument> = (models.AiUsage as Model<AiUsageDocument> | undefined) ?? model<AiUsageDocument>("AiUsage", aiUsageSchema);
