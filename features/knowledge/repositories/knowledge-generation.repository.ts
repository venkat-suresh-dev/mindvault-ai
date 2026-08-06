import { KnowledgeGenerationModel } from "@/features/knowledge/models/knowledge-generation.model";
import type { KnowledgeArtifactType } from "@/features/knowledge/types/knowledge";
import { connectToDatabase } from "@/lib/db/connection";
import { MongoServerError } from "mongodb";

export interface KnowledgeGenerationIdentity {
  userId: string;
  bookId: string;
  artifactType: KnowledgeArtifactType;
  generationId: string;
}

export async function createKnowledgeGeneration(input: KnowledgeGenerationIdentity & { artifactId: string }) {
  await connectToDatabase();
  try {
    return await KnowledgeGenerationModel.findOneAndUpdate(
      { userId: input.userId, bookId: input.bookId, artifactType: input.artifactType, generationId: input.generationId },
      { $setOnInsert: { ...input, status: "QUEUED" } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).lean();
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
    return findActiveKnowledgeGeneration(input.userId, input.bookId, input.artifactType);
  }
}

export async function findActiveKnowledgeGeneration(userId: string, bookId: string, artifactType: KnowledgeArtifactType) {
  await connectToDatabase();
  return KnowledgeGenerationModel.findOne({ userId, bookId, artifactType, status: { $in: ["QUEUED", "PROCESSING", "RETRYING", "CANCEL_REQUESTED"] } }).sort({ createdAt: -1 }).lean();
}

export async function findLatestKnowledgeGeneration(userId: string, bookId: string, artifactType: KnowledgeArtifactType) {
  await connectToDatabase();
  return KnowledgeGenerationModel.findOne({ userId, bookId, artifactType }).sort({ createdAt: -1 }).lean();
}

export async function findKnowledgeGeneration(input: KnowledgeGenerationIdentity) {
  await connectToDatabase();
  return KnowledgeGenerationModel.findOne(input).lean();
}

export async function updateKnowledgeGeneration(input: KnowledgeGenerationIdentity, update: Record<string, unknown>) {
  await connectToDatabase();
  return KnowledgeGenerationModel.findOneAndUpdate(input, { $set: update }, { returnDocument: "after" }).lean();
}

export async function requestKnowledgeGenerationCancellation(input: KnowledgeGenerationIdentity): Promise<boolean> {
  await connectToDatabase();
  const result = await KnowledgeGenerationModel.updateOne({ ...input, status: { $in: ["QUEUED", "PROCESSING", "RETRYING"] } }, { $set: { status: "CANCEL_REQUESTED" } });
  return result.modifiedCount === 1;
}

export async function isKnowledgeGenerationCancellationRequested(input: KnowledgeGenerationIdentity): Promise<boolean> {
  await connectToDatabase();
  return Boolean(await KnowledgeGenerationModel.exists({ ...input, status: "CANCEL_REQUESTED" }));
}

export async function deleteKnowledgeGenerationsForBook(bookId: string, userId: string): Promise<void> {
  await connectToDatabase();
  await KnowledgeGenerationModel.deleteMany({ bookId, userId });
}
