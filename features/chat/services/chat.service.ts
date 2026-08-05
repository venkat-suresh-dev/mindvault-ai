import "server-only";

import { createChatProvider, type ChatProvider } from "@/lib/ai/generation";
import { RetrievalService } from "@/features/search/services/retrieval.service";
import type { Citation } from "@/features/search/types/search";
import type { ConversationMemory } from "@/features/conversations/types/conversation";
import { ContextBuilderService } from "./context-builder.service";

export interface ChatResponseStream {
  answer: AsyncIterable<string>;
  citations: Citation[];
}

export class ChatService {
  public constructor(
    private readonly retrievalService = new RetrievalService(),
    private readonly contextBuilder = new ContextBuilderService(),
    private readonly provider: ChatProvider = createChatProvider(),
  ) {}

  public async answerBookQuestion(bookId: string, question: string, memory?: ConversationMemory): Promise<ChatResponseStream> {
    const retrieval = await this.retrievalService.retrieve(bookId, question);
    if (retrieval.segments.length === 0) {
      return { answer: messageStream("I couldn’t find an answer to that in the uploaded book."), citations: [] };
    }
    const context = this.contextBuilder.build(retrieval, question, memory);
    return { answer: this.provider.stream({ prompt: context.prompt }), citations: context.citations };
  }
}

async function* messageStream(message: string): AsyncIterable<string> {
  yield message;
}
