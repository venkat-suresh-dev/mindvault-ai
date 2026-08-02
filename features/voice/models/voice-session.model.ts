import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const VOICE_SESSION_STATUSES = ["ACTIVE", "COMPLETED", "FAILED"] as const;
export type VoiceSessionStatus = (typeof VOICE_SESSION_STATUSES)[number];

const voiceSessionSchema = new Schema(
  {
    bookId: { type: Schema.Types.ObjectId, required: true, ref: "Book", index: true },
    clerkId: { type: String, required: true, index: true },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date },
    duration: { type: Number, min: 0 },
    tokensUsed: { type: Number, min: 0 },
    estimatedCost: { type: Number, min: 0 },
    status: { type: String, enum: VOICE_SESSION_STATUSES, required: true, default: "ACTIVE" },
  },
  { timestamps: true },
);

voiceSessionSchema.index({ clerkId: 1, startedAt: -1 });
voiceSessionSchema.index({ bookId: 1, startedAt: -1 });

export type VoiceSessionDocument = InferSchemaType<typeof voiceSessionSchema>;
export const VoiceSessionModel: Model<VoiceSessionDocument> =
  (models.VoiceSession as Model<VoiceSessionDocument> | undefined) ?? model<VoiceSessionDocument>("VoiceSession", voiceSessionSchema);
