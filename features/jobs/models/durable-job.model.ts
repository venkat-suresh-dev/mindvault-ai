import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { JOB_ERROR_CLASSIFICATIONS, DURABLE_JOB_STATUSES, DURABLE_JOB_TYPES } from "@/features/jobs/types/durable-job";
import { KNOWLEDGE_ARTIFACT_TYPES } from "@/features/knowledge/types/knowledge";

const checkpointSchema = new Schema({
  phase: { type: String, enum: ["EXTRACTING", "CHUNKING", "EMBEDDING", "GENERATING"] },
  nextSegmentIndex: { type: Number, min: 0 },
  lastProcessedPage: { type: Number, min: 0 },
  completedBatches: { type: Number, min: 0 },
  totalBatches: { type: Number, min: 0 },
  providerCallCount: { type: Number, min: 0 },
}, { _id: false });

const durableJobSchema = new Schema({
  type: { type: String, enum: DURABLE_JOB_TYPES, required: true },
  status: { type: String, enum: DURABLE_JOB_STATUSES, required: true, default: "QUEUED" },
  bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
  clerkId: { type: String, required: true, index: true },
  artifactId: { type: Schema.Types.ObjectId, ref: "KnowledgeArtifact" },
  artifactType: { type: String, enum: KNOWLEDGE_ARTIFACT_TYPES },
  generationId: String,
  idempotencyKey: { type: String, required: true },
  attemptCount: { type: Number, required: true, default: 0, min: 0 },
  maxAttempts: { type: Number, required: true, min: 1 },
  nextRunAt: { type: Date, required: true, index: true },
  leaseOwner: String,
  leaseExpiresAt: Date,
  heartbeatAt: Date,
  queuedAt: { type: Date, required: true, default: Date.now },
  startedAt: Date,
  completedAt: Date,
  failedAt: Date,
  cancelledAt: Date,
  errorClassification: { type: String, enum: JOB_ERROR_CLASSIFICATIONS },
  checkpoint: { type: checkpointSchema, required: true, default: {} },
}, { timestamps: true });

durableJobSchema.index({ idempotencyKey: 1 }, { unique: true });
durableJobSchema.index({ status: 1, nextRunAt: 1, leaseExpiresAt: 1 });
durableJobSchema.index({ bookId: 1, clerkId: 1, type: 1, createdAt: -1 });
durableJobSchema.index({ artifactId: 1, generationId: 1 });

export type DurableJobDocument = InferSchemaType<typeof durableJobSchema>;
export const DurableJobModel: Model<DurableJobDocument> = (models.DurableJob as Model<DurableJobDocument> | undefined) ?? model<DurableJobDocument>("DurableJob", durableJobSchema);
