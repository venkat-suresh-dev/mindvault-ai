import { getBookBySlugForUser } from "@/features/books/services/book.service";
import { ConversationService } from "@/features/conversations/services/conversation.service";
import { conversationIdSchema, conversationTitleSchema } from "@/features/conversations/validation/conversation.validation";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string; conversationId: string }> }) {
  const context = await getContext(params);
  if (context instanceof Response) return context;
  const payload = conversationTitleSchema.safeParse((await request.json().catch(() => ({}))).title);
  if (!payload.success) return Response.json({ message: "Provide a valid conversation name." }, { status: 400 });
  try { return Response.json({ conversation: await new ConversationService().rename(context, payload.data) }); }
  catch { return Response.json({ message: "Conversation not found." }, { status: 404 }); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string; conversationId: string }> }) {
  const context = await getContext(params);
  if (context instanceof Response) return context;
  try { await new ConversationService().delete(context); return new Response(null, { status: 204 }); }
  catch { return Response.json({ message: "Conversation not found." }, { status: 404 }); }
}

async function getContext(params: Promise<{ slug: string; conversationId: string }>) {
  const { userId } = await auth();
  if (!userId) return Response.json({ message: "Sign in to manage conversations." }, { status: 401 });
  const { slug, conversationId } = await params;
  if (!conversationIdSchema.safeParse(conversationId).success) return Response.json({ message: "Provide a valid conversation ID." }, { status: 400 });
  try { const book = await getBookBySlugForUser(slug, userId); return { conversationId, bookId: book._id.toString(), clerkId: userId }; }
  catch { return Response.json({ message: "Book not found." }, { status: 404 }); }
}
