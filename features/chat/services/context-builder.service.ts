import "server-only";

import type { RetrievalResult } from "@/features/search/types/search";
import type { ConversationMemory } from "@/features/conversations/types/conversation";
import { aiConfig } from "@/lib/config/ai.config";

export interface BuiltContext {
  text: string;
  citations: RetrievalResult["citations"];
  prompt: string;
}

export class ContextBuilderService {
  public build(retrieval: RetrievalResult, question: string, memory: ConversationMemory = { recentMessages: [] }): BuiltContext {
    const segments = [...retrieval.segments]
      .sort((left, right) => left.segmentIndex - right.segmentIndex)
      .filter((segment, index, all) => all.findIndex((candidate) => candidate.id === segment.id) === index);
    const text = truncateToEstimatedTokens(
      segments.map((segment) => `[Segment ${segment.id}; page ${segment.pageNumber}]\n${segment.text}`).join("\n\n"),
      aiConfig.conversations.maxRetrievedContextTokens,
    );
    return {
      text,
      citations: segments.map((segment) => ({ page: segment.pageNumber, segmentId: segment.id })),
      prompt: buildGroundedPrompt(question, text, memory),
    };
  }
}

function buildGroundedPrompt(question: string, context: string, memory: ConversationMemory): string {
  const summary = memory.summary ? truncateToEstimatedTokens(memory.summary, aiConfig.conversations.maxSummaryTokens) : "No prior conversation summary.";
  const recentMessages = truncateToEstimatedTokens(
    memory.recentMessages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n"),
    aiConfig.conversations.maxRecentMessageTokens,
  );
  return `You are a production knowledge assistant answering questions about one uploaded book.

Answer the user's question directly and use only the supplied book context for factual claims. Conversation memory may clarify what the user means, but it is not source evidence. Never use general knowledge or invent facts beyond the retrieved segments. If the answer is unavailable in those segments, respond exactly: "I couldn't find that information in this book."

Keep answers concise, useful, and clear for a human reader. Do not begin with phrases such as "Based on the provided book context", "According to the context", or "The retrieved documents say". Use Markdown when it improves readability. Do not include citations in the answer text; they are rendered separately.

CONVERSATION SUMMARY:
${summary}

RECENT MESSAGES:
${recentMessages || "No recent messages."}

BOOK CONTEXT:
${context}

USER QUESTION:
${question}`;
}

function truncateToEstimatedTokens(value: string, maxTokens: number): string {
  return value.slice(0, maxTokens * 4).trim();
}
