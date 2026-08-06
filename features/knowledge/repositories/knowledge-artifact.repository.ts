import { KnowledgeArtifactModel } from "@/features/knowledge/models/knowledge-artifact.model";
import type { KnowledgeArtifactType } from "@/features/knowledge/types/knowledge";
import { connectToDatabase } from "@/lib/db/connection";

export async function listKnowledgeArtifacts(bookId: string, clerkId: string) {
  await connectToDatabase();
  return KnowledgeArtifactModel.find({ bookId, clerkId }).sort({ type: 1 }).lean();
}

export async function findKnowledgeArtifact(bookId: string, clerkId: string, type: KnowledgeArtifactType) {
  await connectToDatabase();
  return KnowledgeArtifactModel.findOne({ bookId, clerkId, type }).lean();
}

export async function requestKnowledgeArtifact(bookId: string, clerkId: string, type: KnowledgeArtifactType, generationId: string) {
  await connectToDatabase();
  return KnowledgeArtifactModel.findOneAndUpdate(
    { bookId, clerkId, type },
    { $setOnInsert: { bookId, clerkId, type, generationId, status: "REQUESTED", progress: 0, sourceSegments: [] } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
}

/**
 * Returns the stable artifact target without changing completed content.
 */
export async function prepareKnowledgeArtifactRegeneration(bookId: string, clerkId: string, type: KnowledgeArtifactType, _generationId: string) {
  void _generationId;
  await connectToDatabase();
  return KnowledgeArtifactModel.findOne({ bookId, clerkId, type, status: "COMPLETED" }).lean();
}

export async function updateKnowledgeArtifact(bookId: string, clerkId: string, type: KnowledgeArtifactType, generationId: string, update: Record<string, unknown>) {
  await connectToDatabase();
  return KnowledgeArtifactModel.findOneAndUpdate({ bookId, clerkId, type, generationId }, { $set: update }, { returnDocument: "after" }).lean();
}

export async function markKnowledgeArtifactFailed(bookId: string, clerkId: string, type: KnowledgeArtifactType, generationId: string): Promise<void> {
  await connectToDatabase();
  await KnowledgeArtifactModel.updateOne(
    { bookId, clerkId, type, generationId },
    { $set: { status: "FAILED", progress: 0, failedAt: new Date(), errorMessage: "Generation temporarily unavailable. Please try again." }, $unset: { completedAt: 1 } },
  );
}

export async function markKnowledgeArtifactRetrying(bookId: string, clerkId: string, type: KnowledgeArtifactType, generationId: string): Promise<void> {
  await connectToDatabase();
  await KnowledgeArtifactModel.updateOne(
    { bookId, clerkId, type, generationId },
    { $set: { status: "RETRYING", errorMessage: "Generation is retrying after a temporary provider error.", lastProgressAt: new Date() }, $unset: { failedAt: 1 } },
  );
}

export async function markKnowledgeArtifactPayloadInvalid(bookId: string, clerkId: string, artifactId: string): Promise<void> {
  await connectToDatabase();
  await KnowledgeArtifactModel.updateOne(
    { _id: artifactId, bookId, clerkId },
    { $set: { status: "FAILED", progress: 0, failedAt: new Date(), errorMessage: "This learning material needs to be generated again." }, $unset: { completedAt: 1, mindMap: 1, summary: 1, takeaways: 1, flashcards: 1, quiz: 1 } },
  );
}

export async function completeKnowledgeArtifact(bookId: string, clerkId: string, type: KnowledgeArtifactType, generationId: string, payload: Record<string, unknown>, sourceSegments: unknown[]): Promise<void> {
  await connectToDatabase();
  await KnowledgeArtifactModel.updateOne(
    { bookId, clerkId, type },
    { $set: { ...payload, sourceSegments, generationId, status: "COMPLETED", progress: 100, completedAt: new Date() }, $unset: { errorMessage: 1, failedAt: 1 } },
  );
}

export async function failStaleKnowledgeArtifacts(bookId: string, clerkId: string, staleBefore: Date): Promise<void> {
  await connectToDatabase();
  await KnowledgeArtifactModel.updateMany(
    { bookId, clerkId, status: { $in: ["REQUESTED", "GENERATING"] }, updatedAt: { $lt: staleBefore } },
    { $set: { status: "FAILED", progress: 0, failedAt: new Date(), errorMessage: "Generation temporarily unavailable. Please try again." }, $unset: { completedAt: 1 } },
  );
}

export async function normalizeKnowledgeArtifactLifecycle(bookId: string, clerkId: string): Promise<void> {
  await connectToDatabase();
  const now = new Date();
  await KnowledgeArtifactModel.updateMany(
    { bookId, clerkId, status: "COMPLETED" },
    { $set: { progress: 100 }, $unset: { errorMessage: 1, failedAt: 1 } },
  );
  await KnowledgeArtifactModel.updateMany(
    { bookId, clerkId, status: "COMPLETED", $or: [{ completedAt: { $exists: false } }, { completedAt: null }] },
    { $set: { completedAt: now } },
  );
  await KnowledgeArtifactModel.updateMany(
    { bookId, clerkId, status: "FAILED" },
    { $set: { progress: 0 }, $unset: { completedAt: 1 } },
  );
  await KnowledgeArtifactModel.updateMany(
    { bookId, clerkId, status: "FAILED", $or: [{ failedAt: { $exists: false } }, { failedAt: null }] },
    { $set: { failedAt: now } },
  );
  await KnowledgeArtifactModel.updateMany(
    { bookId, clerkId, status: "FAILED", $or: [{ errorMessage: { $exists: false } }, { errorMessage: null }] },
    { $set: { errorMessage: "Generation temporarily unavailable. Please try again." } },
  );
  await KnowledgeArtifactModel.updateMany(
    { bookId, clerkId, status: { $in: ["REQUESTED", "GENERATING"] }, $or: [{ errorMessage: { $exists: true, $ne: null } }, { failedAt: { $exists: true } }] },
    { $set: { status: "FAILED", progress: 0, failedAt: now, errorMessage: "Generation temporarily unavailable. Please try again." }, $unset: { completedAt: 1 } },
  );
}

export async function deleteKnowledgeArtifactsForBook(bookId: string, clerkId: string): Promise<void> {
  await connectToDatabase();
  await KnowledgeArtifactModel.deleteMany({ bookId, clerkId });
}

export async function findStaleKnowledgeArtifactsForReconciliation(staleBefore: Date) {
  await connectToDatabase();
  return KnowledgeArtifactModel.find({ status: { $in: ["REQUESTED", "GENERATING"] }, updatedAt: { $lt: staleBefore } })
    .select({ _id: 1, bookId: 1, clerkId: 1, type: 1, generationId: 1, status: 1, updatedAt: 1 })
    .limit(100)
    .lean();
}
