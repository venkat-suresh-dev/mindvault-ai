import type { Citation } from "@/features/search/types/search";
import type { MessageRole } from "@/features/conversations/models/message.model";

export interface ConversationRecord {
  id: string;
  bookId: string;
  title: string;
  summary?: string;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessageRecord {
  id: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  tokenCount: number;
  sequence: number;
  createdAt: string;
}

export interface ConversationMemory {
  summary?: string;
  recentMessages: ConversationMessageRecord[];
}

export interface ConversationMessagePage {
  messages: ConversationMessageRecord[];
  nextBeforeSequence?: number;
}
