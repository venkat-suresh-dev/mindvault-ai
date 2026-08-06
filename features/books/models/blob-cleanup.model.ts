import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const blobCleanupSchema = new Schema({
  bookId: { type: Schema.Types.ObjectId, required: true, ref: "Book", index: true },
  clerkId: { type: String, required: true, index: true },
  blobKey: { type: String, required: true },
  status: { type: String, enum: ["PENDING", "FAILED"], required: true, default: "PENDING" },
  retryCount: { type: Number, required: true, min: 0, default: 0 },
  errorClassification: String,
  lastErrorAt: Date,
}, { timestamps: true });
blobCleanupSchema.index({ bookId: 1, clerkId: 1, blobKey: 1 }, { unique: true });
export type BlobCleanupDocument = InferSchemaType<typeof blobCleanupSchema>;
export const BlobCleanupModel: Model<BlobCleanupDocument> = (models.BlobCleanup as Model<BlobCleanupDocument> | undefined) ?? model<BlobCleanupDocument>("BlobCleanup", blobCleanupSchema);
