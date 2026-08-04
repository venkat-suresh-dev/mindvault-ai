import { getBookBySlugForUser } from "@/features/books/services/book.service";
import { ChatService } from "@/features/chat/services/chat.service";
import type { ChatStreamEvent } from "@/features/chat/types/chat";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const requestSchema = z.object({ question: z.string().trim().min(1).max(2_000) });

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ message: "Sign in to chat with your book." }, { status: 401 });
  const payload = requestSchema.safeParse(await request.json().catch(() => undefined));
  if (!payload.success) return Response.json({ message: "Provide a valid question." }, { status: 400 });

  try {
    const { slug } = await params;
    const book = await getBookBySlugForUser(slug, userId);
    if (book.processingStatus !== "READY") return Response.json({ message: "This book is still being processed." }, { status: 409 });
    const result = await new ChatService().answerBookQuestion(book._id.toString(), payload.data.question);
    return new Response(createChatStream(result.answer, result.citations), { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "Unable to answer this question right now." }, { status: 500 });
  }
}

function createChatStream(answer: AsyncIterable<string>, citations: ChatStreamEvent["citations"]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const text of answer) controller.enqueue(encoder.encode(`${JSON.stringify({ type: "text", text } satisfies ChatStreamEvent)}\n`));
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "citations", citations } satisfies ChatStreamEvent)}\n`));
      } catch {
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", text: "Unable to complete this answer." } satisfies ChatStreamEvent)}\n`));
      } finally { controller.close(); }
    },
  });
}
