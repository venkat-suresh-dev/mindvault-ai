import { ConversationModel } from "@/features/conversations/models/conversation.model";
import { connectToDatabase } from "@/lib/db/connection";
import type { ClientSession } from "mongoose";

export interface ConversationOwnership {
  conversationId: string;
  bookId: string;
  clerkId: string;
}

export async function createConversation(input: { bookId: string; clerkId: string; title: string }, session?: ClientSession) {
  await connectToDatabase();
  const [conversation] = await ConversationModel.create([input], { session });
  return conversation;
}

export async function findConversationForUser({ conversationId, bookId, clerkId }: ConversationOwnership) {
  await connectToDatabase();
  return ConversationModel.findOne({ _id: conversationId, bookId, clerkId }).lean();
}

export async function findConversationsForBook(bookId: string, clerkId: string, limit: number) {
  await connectToDatabase();
  return ConversationModel.find({ bookId, clerkId }).sort({ updatedAt: -1 }).limit(limit).lean();
}

export async function renameConversation({ conversationId, bookId, clerkId }: ConversationOwnership, title: string) {
  await connectToDatabase();
  return ConversationModel.findOneAndUpdate({ _id: conversationId, bookId, clerkId }, { $set: { title } }, { returnDocument: "after" }).lean();
}

export async function deleteConversation({ conversationId, bookId, clerkId }: ConversationOwnership, session?: ClientSession) {
  await connectToDatabase();
  return ConversationModel.deleteOne({ _id: conversationId, bookId, clerkId }, { session });
}

export async function reserveMessageSequence({ conversationId, bookId, clerkId }: ConversationOwnership) {
  await connectToDatabase();
  return ConversationModel.findOneAndUpdate(
    { _id: conversationId, bookId, clerkId },
    { $inc: { nextMessageSequence: 1 } },
    { returnDocument: "after", projection: { nextMessageSequence: 1 } },
  ).lean();
}

export async function recordPersistedMessage({ conversationId, bookId, clerkId }: ConversationOwnership, occurredAt: Date) {
  await connectToDatabase();
  return ConversationModel.updateOne(
    { _id: conversationId, bookId, clerkId },
    { $inc: { messageCount: 1 }, $max: { lastMessageAt: occurredAt } },
  );
}

export async function updateConversationSummary(
  { conversationId, bookId, clerkId }: ConversationOwnership,
  summary: string,
  summaryThroughSequence: number,
) {
  await connectToDatabase();
  return ConversationModel.updateOne(
    { _id: conversationId, bookId, clerkId },
    { $set: { summary, summaryThroughSequence } },
  );
}

export async function deleteConversationsForBook(bookId: string, clerkId: string, session?: ClientSession) {
  await connectToDatabase();
  return ConversationModel.deleteMany({ bookId, clerkId }, { session });
}
