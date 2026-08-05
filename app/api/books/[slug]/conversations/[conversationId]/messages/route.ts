import { getBookBySlugForUser } from "@/features/books/services/book.service";
import { MessageService } from "@/features/conversations/services/message.service";
import { conversationIdSchema, messagePageQuerySchema } from "@/features/conversations/validation/conversation.validation";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string; conversationId: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ message: "Sign in to view messages." }, { status: 401 });
  const { slug, conversationId } = await params;
  const query = messagePageQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!conversationIdSchema.safeParse(conversationId).success || !query.success) return Response.json({ message: "Provide valid message options." }, { status: 400 });
  try {
    const book = await getBookBySlugForUser(slug, userId);
    const page = await new MessageService().list({ conversationId, bookId: book._id.toString(), clerkId: userId }, query.data.beforeSequence, query.data.limit);
    return Response.json(page, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ message: "Conversation not found." }, { status: 404 }); }
}
