import "server-only";

import { ChatService } from "@/features/chat/services/chat.service";
import type { ChatStreamEvent } from "@/features/chat/types/chat";
import { ConversationSummaryService } from "@/features/conversations/services/conversation-summary.service";
import { ConversationService } from "@/features/conversations/services/conversation.service";
import { MessageService } from "@/features/conversations/services/message.service";
import { aiConfig } from "@/lib/config/ai.config";

export class ConversationChatService {
  public constructor(
    private readonly conversationService = new ConversationService(),
    private readonly messageService = new MessageService(),
    private readonly summaryService = new ConversationSummaryService(),
    private readonly chatService = new ChatService(),
  ) {}

  public async *answer(input: { bookId: string; clerkId: string; question: string; conversationId?: string }): AsyncIterable<ChatStreamEvent> {
    const conversation = input.conversationId
      ? await this.conversationService.get({ conversationId: input.conversationId, bookId: input.bookId, clerkId: input.clerkId })
      : await this.conversationService.create(input.bookId, input.clerkId, createConversationTitle(input.question));
    const ownership = { conversationId: conversation.id, bookId: input.bookId, clerkId: input.clerkId };
    const memoryPage = await this.messageService.list(ownership, undefined, aiConfig.conversations.recentMessageCount);
    await this.messageService.append(ownership, "user", input.question);
    const result = await this.chatService.answerBookQuestion(input.bookId, input.question, { summary: conversation.summary, recentMessages: memoryPage.messages });
    yield { type: "conversation", conversation };

    let answer = "";
    try {
      for await (const text of result.answer) {
        answer += text;
        yield { type: "text", text };
      }
    } catch (error) {
      console.error("Conversation answer stream failed.", error);
      yield { type: "error", text: "Generation temporarily unavailable. Please try again in a few moments." };
      return;
    }

    try {
      await this.messageService.append(ownership, "assistant", answer, result.citations);
      await this.summaryService.refreshIfNeeded(ownership);
      yield { type: "citations", citations: result.citations };
    } catch {
      yield { type: "citations", citations: result.citations };
      yield { type: "persistence-error", text: "This response was not saved. You can continue chatting, but it may be missing when you return." };
    }
  }
}

function createConversationTitle(question: string): string {
  const normalized = question.replace(/\s+/g, " ").trim();
  return normalized.length <= 80 ? normalized : `${normalized.slice(0, 77).trimEnd()}…`;
}
