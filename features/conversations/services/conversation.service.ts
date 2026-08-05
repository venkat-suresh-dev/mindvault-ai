import "server-only";

import { ConversationNotFoundError } from "@/features/conversations/errors/conversation-errors";
import {
  createConversation,
  deleteConversation,
  findConversationForUser,
  findConversationsForBook,
  renameConversation,
  type ConversationOwnership,
} from "@/features/conversations/repositories/conversation.repository";
import type { ConversationRecord } from "@/features/conversations/types/conversation";

export class ConversationService {
  public async create(bookId: string, clerkId: string, title: string): Promise<ConversationRecord> {
    return toConversationRecord(await createConversation({ bookId, clerkId, title }));
  }

  public async get(ownership: ConversationOwnership): Promise<ConversationRecord> {
    const conversation = await findConversationForUser(ownership);
    if (!conversation) throw new ConversationNotFoundError();
    return toConversationRecord(conversation);
  }

  public async list(bookId: string, clerkId: string, limit: number): Promise<ConversationRecord[]> {
    return (await findConversationsForBook(bookId, clerkId, limit)).map(toConversationRecord);
  }

  public async rename(ownership: ConversationOwnership, title: string): Promise<ConversationRecord> {
    const conversation = await renameConversation(ownership, title);
    if (!conversation) throw new ConversationNotFoundError();
    return toConversationRecord(conversation);
  }

  public async delete(ownership: ConversationOwnership): Promise<void> {
    const { deleteMessagesForConversation } = await import("@/features/conversations/repositories/message.repository");
    const result = await deleteConversation(ownership);
    if (result.deletedCount !== 1) throw new ConversationNotFoundError();
    await deleteMessagesForConversation(ownership.conversationId);
  }
}

function toConversationRecord(conversation: {
  _id: { toString(): string };
  bookId: { toString(): string };
  title: string;
  summary?: string | null;
  messageCount: number;
  lastMessageAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ConversationRecord {
  return {
    id: conversation._id.toString(),
    bookId: conversation.bookId.toString(),
    title: conversation.title,
    summary: conversation.summary ?? undefined,
    messageCount: conversation.messageCount,
    lastMessageAt: conversation.lastMessageAt?.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}
