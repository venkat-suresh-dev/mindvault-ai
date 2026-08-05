import "server-only";

import { createChatProvider, type ChatProvider } from "@/lib/ai/generation";
import { aiConfig } from "@/lib/config/ai.config";
import { findConversationForUser, updateConversationSummary, type ConversationOwnership } from "@/features/conversations/repositories/conversation.repository";
import { findMessagesForSummary } from "@/features/conversations/repositories/message.repository";

export class ConversationSummaryService {
  public constructor(private readonly provider: ChatProvider = createChatProvider()) {}

  public async refreshIfNeeded(ownership: ConversationOwnership): Promise<void> {
    const conversation = await findConversationForUser(ownership);
    if (!conversation || conversation.messageCount < aiConfig.conversations.summaryTriggerMessageCount) return;
    const throughSequence = conversation.nextMessageSequence - aiConfig.conversations.recentMessageCount;
    if (throughSequence <= conversation.summaryThroughSequence) return;

    const messages = await findMessagesForSummary(ownership.conversationId, conversation.summaryThroughSequence, throughSequence);
    if (messages.length === 0) return;
    const summary = await this.provider.generate({ prompt: buildSummaryPrompt(conversation.summary, messages.map((message) => ({ role: message.role, content: message.content }))) });
    if (!summary.trim()) return;
    await updateConversationSummary(ownership, truncateToEstimatedTokens(summary, aiConfig.conversations.maxSummaryTokens), throughSequence);
  }
}

function buildSummaryPrompt(existingSummary: string | null | undefined, messages: { role: string; content: string }[]): string {
  return `Summarize a conversation about an uploaded book for use as short-term memory. Preserve the user's goals, questions, preferences, definitions, and unresolved follow-ups. Do not invent facts, and do not treat prior assistant answers as authoritative book evidence. Be concise.\n\nEXISTING SUMMARY:\n${existingSummary ?? "None"}\n\nNEW MESSAGES:\n${messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n")}`;
}

function truncateToEstimatedTokens(value: string, maxTokens: number): string {
  return value.slice(0, maxTokens * 4).trim();
}
