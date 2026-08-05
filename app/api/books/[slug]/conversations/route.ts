import { getBookBySlugForUser } from "@/features/books/services/book.service";
import { ConversationService } from "@/features/conversations/services/conversation.service";
import { conversationListQuerySchema } from "@/features/conversations/validation/conversation.validation";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ message: "Sign in to view conversations." }, { status: 401 });
  const query = conversationListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return Response.json({ message: "Provide valid list options." }, { status: 400 });
  try {
    const book = await getBookBySlugForUser((await params).slug, userId);
    return Response.json({ conversations: await new ConversationService().list(book._id.toString(), userId, query.data.limit) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "Unable to load conversations." }, { status: 404 });
  }
}
