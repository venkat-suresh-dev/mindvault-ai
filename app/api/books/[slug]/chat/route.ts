import { getBookBySlugForUser } from "@/features/books/services/book.service";
import { ConversationChatService } from "@/features/chat/services/conversation-chat.service";
import type { ChatStreamEvent } from "@/features/chat/types/chat";
import { conversationIdSchema } from "@/features/conversations/validation/conversation.validation";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const requestSchema = z.object({ question: z.string().trim().min(1).max(2_000), conversationId: conversationIdSchema.optional() });

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ message: "Sign in to chat with your book." }, { status: 401 });
  const payload = requestSchema.safeParse(await request.json().catch(() => undefined));
  if (!payload.success) return Response.json({ message: "Provide a valid question." }, { status: 400 });

  try {
    const { slug } = await params;
    const book = await getBookBySlugForUser(slug, userId);
    if (book.processingStatus !== "READY") return Response.json({ message: "This book is still being processed." }, { status: 409 });
    const events = new ConversationChatService().answer({ bookId: book._id.toString(), clerkId: userId, ...payload.data });
    return new Response(createChatStream(events), { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "Unable to answer this question right now." }, { status: 500 });
  }
}

function createChatStream(events: AsyncIterable<ChatStreamEvent>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      } catch (error) {
        console.error("Chat NDJSON stream failed.", error);
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", text: "Generation temporarily unavailable. Please try again in a few moments." } satisfies ChatStreamEvent)}\n`));
      } finally { controller.close(); }
    },
  });
}
