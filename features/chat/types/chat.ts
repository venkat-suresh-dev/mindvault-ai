import type { Citation } from "@/features/search/types/search";
import type { ConversationRecord } from "@/features/conversations/types/conversation";

export interface ChatRequest {
  question: string;
  conversationId?: string;
}

export interface ChatStreamEvent {
  type: "conversation" | "text" | "citations" | "error" | "persistence-error";
  text?: string;
  citations?: Citation[];
  conversation?: ConversationRecord;
}

export type { Citation };
