import { MessageModel, type MessageRole } from "@/features/conversations/models/message.model";
import { connectToDatabase } from "@/lib/db/connection";
import type { ClientSession } from "mongoose";

export interface StoredCitation {
  bookSegmentId: string;
  pageNumber: number;
}

export async function insertMessage(
  input: { conversationId: string; role: MessageRole; content: string; citations: StoredCitation[]; tokenCount: number; sequence: number },
  session?: ClientSession,
) {
  await connectToDatabase();
  const [message] = await MessageModel.create([input], { session });
  return message;
}

export async function findMessagesBeforeSequence(conversationId: string, beforeSequence: number | undefined, limit: number) {
  await connectToDatabase();
  return MessageModel.find({ conversationId, ...(beforeSequence ? { sequence: { $lt: beforeSequence } } : {}) }).sort({ sequence: -1 }).limit(limit + 1).lean();
}

export async function findMessagesAfterSequence(conversationId: string, afterSequence: number, limit: number) {
  await connectToDatabase();
  return MessageModel.find({ conversationId, sequence: { $gt: afterSequence } }).sort({ sequence: 1 }).limit(limit).lean();
}

export async function findMessagesForSummary(conversationId: string, afterSequence: number, throughSequence: number) {
  await connectToDatabase();
  return MessageModel.find({ conversationId, sequence: { $gt: afterSequence, $lte: throughSequence } }).sort({ sequence: 1 }).lean();
}

export async function deleteMessagesForConversation(conversationId: string, session?: ClientSession) {
  await connectToDatabase();
  return MessageModel.deleteMany({ conversationId }, { session });
}
