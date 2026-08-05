import "server-only";

import { ConversationNotFoundError } from "@/features/conversations/errors/conversation-errors";
import { reserveMessageSequence, recordPersistedMessage, type ConversationOwnership } from "@/features/conversations/repositories/conversation.repository";
import { findMessagesAfterSequence, findMessagesBeforeSequence, insertMessage } from "@/features/conversations/repositories/message.repository";
import type { ConversationMessagePage, ConversationMessageRecord } from "@/features/conversations/types/conversation";
import type { Citation } from "@/features/search/types/search";
import type { MessageRole } from "@/features/conversations/models/message.model";

export class MessageService {
  public async append(ownership: ConversationOwnership, role: MessageRole, content: string, citations: Citation[] = []): Promise<ConversationMessageRecord> {
    const reservation = await reserveMessageSequence(ownership);
    if (!reservation) throw new ConversationNotFoundError();
    const message = await insertMessage({
      conversationId: ownership.conversationId,
      role,
      content,
      citations: citations.map((citation) => ({ bookSegmentId: citation.segmentId, pageNumber: citation.page })),
      tokenCount: estimateTokenCount(content),
      sequence: reservation.nextMessageSequence,
    });
    await recordPersistedMessage(ownership, message.createdAt);
    return toMessageRecord(message);
  }

  public async list(ownership: ConversationOwnership, beforeSequence: number | undefined, limit: number): Promise<ConversationMessagePage> {
    const { findConversationForUser } = await import("@/features/conversations/repositories/conversation.repository");
    if (!(await findConversationForUser(ownership))) throw new ConversationNotFoundError();
    const rows = await findMessagesBeforeSequence(ownership.conversationId, beforeSequence, limit);
    const hasMore = rows.length > limit;
    const messages = rows.slice(0, limit).reverse().map(toMessageRecord);
    return { messages, nextBeforeSequence: hasMore ? messages[0]?.sequence : undefined };
  }

  public async getRecentAfter(ownership: ConversationOwnership, afterSequence: number, limit: number): Promise<ConversationMessageRecord[]> {
    return (await findMessagesAfterSequence(ownership.conversationId, afterSequence, limit)).map(toMessageRecord);
  }
}

export function estimateTokenCount(content: string): number {
  return Math.ceil(content.trim().length / 4);
}

function toMessageRecord(message: {
  _id: { toString(): string };
  role: MessageRole;
  content: string;
  citations: { bookSegmentId: { toString(): string }; pageNumber: number }[];
  tokenCount: number;
  sequence: number;
  createdAt: Date;
}): ConversationMessageRecord {
  return {
    id: message._id.toString(),
    role: message.role,
    content: message.content,
    citations: message.citations.map((citation) => ({ segmentId: citation.bookSegmentId.toString(), page: citation.pageNumber })),
    tokenCount: message.tokenCount,
    sequence: message.sequence,
    createdAt: message.createdAt.toISOString(),
  };
}
