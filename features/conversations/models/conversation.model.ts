import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const conversationSchema = new Schema(
  {
    bookId: { type: Schema.Types.ObjectId, required: true, ref: "Book", index: true },
    clerkId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true },
    messageCount: { type: Number, required: true, default: 0, min: 0 },
    lastMessageAt: { type: Date },
    nextMessageSequence: { type: Number, required: true, default: 0, min: 0 },
    summaryThroughSequence: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

conversationSchema.index({ clerkId: 1, updatedAt: -1 });
conversationSchema.index({ bookId: 1, updatedAt: -1 });
conversationSchema.index({ bookId: 1, clerkId: 1, updatedAt: -1 });

export type ConversationDocument = InferSchemaType<typeof conversationSchema>;
export const ConversationModel: Model<ConversationDocument> =
  (models.Conversation as Model<ConversationDocument> | undefined) ?? model<ConversationDocument>("Conversation", conversationSchema);
