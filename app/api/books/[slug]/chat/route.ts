import { getBookBySlugForUser } from "@/features/books/services/book.service";
import { ConversationChatService } from "@/features/chat/services/conversation-chat.service";
import type { ChatStreamEvent } from "@/features/chat/types/chat";
import { conversationIdSchema } from "@/features/conversations/validation/conversation.validation";
import { auth } from "@clerk/nextjs/server";
import { log, safeErrorMetadata } from "@/lib/observability/logger";
import { captureException } from "@/lib/observability/telemetry";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createRequestContext } from "@/lib/security/request-context";
import { z } from "zod";

const requestSchema = z.object({ question: z.string().trim().min(1).max(2_000), conversationId: conversationIdSchema.optional() });

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ message: "Sign in to chat with your book." }, { status: 401 });
  const requestContext = await createRequestContext(userId, request);
  const rateLimit = await enforceRateLimit("chat", requestContext);
  if (!rateLimit.allowed) {
    return Response.json(
      { message: "Too many chat requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }
  const payload = requestSchema.safeParse(await request.json().catch(() => undefined));
  if (!payload.success) return Response.json({ message: "Provide a valid question." }, { status: 400 });

  try {
    const { slug } = await params;
    const book = await getBookBySlugForUser(slug, userId);
    if (book.processingStatus !== "READY") return Response.json({ message: "This book is still being processed." }, { status: 409 });
    const events = new ConversationChatService().answer({ bookId: book._id.toString(), clerkId: userId, operationId: requestContext.requestId, ...payload.data });
    return new Response(createChatStream(events, requestContext.requestId), { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Request-Id": requestContext.requestId } });
  } catch (error) {
    log("error", "chat.route.failed", { requestId: requestContext.requestId, ...safeErrorMetadata(error) });
    await captureException(error, { requestId: requestContext.requestId, operation: "chat-route" });
    return Response.json({ message: "Unable to answer this question right now." }, { status: 500 });
  }
}

function createChatStream(events: AsyncIterable<ChatStreamEvent>, requestId: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      } catch (error) {
        log("error", "chat.stream.failed", { requestId, ...safeErrorMetadata(error) });
        void captureException(error, { requestId, operation: "chat-stream" });
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", text: "Generation temporarily unavailable. Please try again in a few moments." } satisfies ChatStreamEvent)}\n`));
      } finally { controller.close(); }
    },
  });
}
