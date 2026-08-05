import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const MESSAGE_ROLES = ["user", "assistant"] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

const citationSchema = new Schema(
  {
    bookSegmentId: { type: Schema.Types.ObjectId, required: true, ref: "BookSegment" },
    pageNumber: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, required: true, ref: "Conversation", index: true },
    role: { type: String, enum: MESSAGE_ROLES, required: true },
    content: { type: String, required: true, trim: true },
    citations: { type: [citationSchema], required: true, default: [] },
    tokenCount: { type: Number, required: true, min: 0 },
    sequence: { type: Number, required: true, min: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ conversationId: 1, sequence: 1 }, { unique: true });
messageSchema.index({ conversationId: 1, createdAt: 1 });

export type MessageDocument = InferSchemaType<typeof messageSchema>;
export const MessageModel: Model<MessageDocument> =
  (models.Message as Model<MessageDocument> | undefined) ?? model<MessageDocument>("Message", messageSchema);
