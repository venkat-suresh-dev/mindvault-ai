import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { KNOWLEDGE_ARTIFACT_STATUSES, KNOWLEDGE_ARTIFACT_TYPES, KNOWLEDGE_GENERATION_STAGES } from "@/features/knowledge/types/knowledge";

const citationSchema = new Schema({ segmentId: { type: Schema.Types.ObjectId, required: true, ref: "BookSegment" }, pageNumber: { type: Number, required: true, min: 1 } }, { _id: false });
const summarySchema = new Schema({ executiveSummary: String, overview: String, mainThemes: [String], importantConcepts: [String], mainArguments: [String], conclusion: String }, { _id: false });
const takeawaySchema = new Schema({ text: { type: String, required: true }, citations: { type: [citationSchema], required: true } }, { _id: false });
const flashcardSchema = new Schema({ question: String, answer: String, difficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"] }, citations: { type: [citationSchema], required: true } }, { _id: false });
const quizSchema = new Schema({ type: { type: String, enum: ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"] }, question: String, options: [String], answer: String, explanation: String, citations: { type: [citationSchema], required: true } }, { _id: false });
const mindMapNodeSchema = new Schema({ topic: { type: String, required: true } }, { _id: false });
mindMapNodeSchema.add({ children: { type: [mindMapNodeSchema], default: [] } });
// Lifecycle fields below remain only for already-persisted records. New
// generation progress, retry, failure, and cancellation state belongs solely
// to KnowledgeGeneration and must never be written through this model.
// generationId is retained as the atomic publish-fence token: regeneration
// changes it without touching completed content, so an older executor cannot
// replace a newer artifact's stable output.
const knowledgeArtifactSchema = new Schema({
  bookId: { type: Schema.Types.ObjectId, required: true, ref: "Book", index: true }, clerkId: { type: String, required: true, index: true }, type: { type: String, enum: KNOWLEDGE_ARTIFACT_TYPES, required: true }, generationId: { type: String, required: true }, status: { type: String, enum: KNOWLEDGE_ARTIFACT_STATUSES, required: true, default: "REQUESTED" }, progress: { type: Number, required: true, min: 0, max: 100, default: 0 }, generationStage: { type: String, enum: KNOWLEDGE_GENERATION_STAGES }, currentBatch: { type: Number, min: 1 }, totalBatches: { type: Number, min: 1 }, startedAt: Date, completedAt: Date, failedAt: Date, lastProgressAt: Date, errorMessage: String, sourceSegments: { type: [citationSchema], required: true, default: [] }, summary: summarySchema, takeaways: new Schema({ items: { type: [takeawaySchema], required: true } }, { _id: false }), flashcards: new Schema({ items: { type: [flashcardSchema], required: true } }, { _id: false }), quiz: new Schema({ items: { type: [quizSchema], required: true } }, { _id: false }), mindMap: new Schema({ root: { type: mindMapNodeSchema, required: true } }, { _id: false }),
}, { timestamps: true });
knowledgeArtifactSchema.index({ bookId: 1, type: 1 }, { unique: true });
export type KnowledgeArtifactDocument = InferSchemaType<typeof knowledgeArtifactSchema>;
export const KnowledgeArtifactModel: Model<KnowledgeArtifactDocument> = (models.KnowledgeArtifact as Model<KnowledgeArtifactDocument> | undefined) ?? model<KnowledgeArtifactDocument>("KnowledgeArtifact", knowledgeArtifactSchema);
