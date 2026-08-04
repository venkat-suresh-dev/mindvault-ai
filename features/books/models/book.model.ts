import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const BOOK_PROCESSING_STATUSES = ["UPLOADING", "PROCESSING", "PROCESSING_EMBEDDINGS", "READY", "FAILED"] as const;
export type BookProcessingStatus = (typeof BOOK_PROCESSING_STATUSES)[number];

const bookSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    normalizedTitle: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    author: { type: String, required: true, trim: true },
    persona: { type: String, trim: true },
    fileUrl: { type: String },
    fileBlobKey: { type: String },
    coverUrl: { type: String },
    coverBlobKey: { type: String },
    fileSize: { type: Number, required: true, min: 0 },
    totalSegments: { type: Number, required: true, default: 0, min: 0 },
    processingStatus: { type: String, enum: BOOK_PROCESSING_STATUSES, required: true, default: "UPLOADING" },
  },
  { timestamps: true },
);

bookSchema.index({ createdAt: -1 });
bookSchema.index({ clerkId: 1, normalizedTitle: 1 }, { unique: true });
bookSchema.index({ clerkId: 1, slug: 1 }, { unique: true });

export type BookDocument = InferSchemaType<typeof bookSchema>;
export const BookModel: Model<BookDocument> = (models.Book as Model<BookDocument> | undefined) ?? model<BookDocument>("Book", bookSchema);
