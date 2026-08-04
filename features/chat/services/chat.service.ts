import "server-only";

import { createChatProvider, type ChatProvider } from "@/lib/ai/generation";
import { RetrievalService } from "@/features/search/services/retrieval.service";
import type { Citation } from "@/features/search/types/search";
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

  public async answerBookQuestion(bookId: string, question: string): Promise<ChatResponseStream> {
    const retrieval = await this.retrievalService.retrieve(bookId, question);
    if (retrieval.segments.length === 0) {
      return { answer: messageStream("I couldn’t find an answer to that in the uploaded book."), citations: [] };
    }
    const context = this.contextBuilder.build(retrieval);
    return { answer: this.provider.stream({ prompt: buildGroundedPrompt(question, context.text) }), citations: context.citations };
  }
}

function buildGroundedPrompt(question: string, context: string): string {
  return `You are a production knowledge assistant answering questions about one uploaded book.

Answer the user's question directly and use only the supplied book context. Never use general knowledge or invent facts beyond the retrieved segments. If the answer is unavailable in those segments, respond exactly: "I couldn't find that information in this book."

Keep answers concise, useful, and clear for a human reader. Do not begin with phrases such as "Based on the provided book context", "According to the context", or "The retrieved documents say". Use Markdown when it improves readability: headings for longer explanations, bullets for lists, numbered steps for procedures, **bold** for important terms, and inline or fenced code when relevant. Avoid repetition. Do not include citations in the answer text; they are rendered separately.

BOOK CONTEXT:
${context}

USER QUESTION:
${question}`;
}

async function* messageStream(message: string): AsyncIterable<string> {
  yield message;
}
