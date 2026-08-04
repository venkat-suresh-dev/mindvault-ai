import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const bookSegmentSchema = new Schema(
  {
    bookId: { type: Schema.Types.ObjectId, required: true, ref: "Book", index: true },
    segmentIndex: { type: Number, required: true, min: 0 },
    pageNumber: { type: Number, required: true, min: 1 },
    text: { type: String, required: true },
    wordCount: { type: Number, required: true, min: 1 },
    characterCount: { type: Number, required: true, min: 1 },
    embedding: { type: [Number], default: undefined },
    embeddingModel: { type: String },
    embeddingDimensions: { type: Number, min: 1 },
    embeddedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

bookSegmentSchema.index({ bookId: 1, segmentIndex: 1 }, { unique: true });

export type BookSegmentDocument = InferSchemaType<typeof bookSegmentSchema>;
export const BookSegmentModel: Model<BookSegmentDocument> =
  (models.BookSegment as Model<BookSegmentDocument> | undefined) ?? model<BookSegmentDocument>("BookSegment", bookSegmentSchema);
