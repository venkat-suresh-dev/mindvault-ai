import { BookDetailsPage } from "@/features/books/components/book-details-page";
import { getBookDetailsBySlugForUser } from "@/features/books/services/book.service";
import type { BookDetailsRecord } from "@/features/books/types/book";
import { ConversationService } from "@/features/conversations/services/conversation.service";
import type { ConversationRecord } from "@/features/conversations/types/conversation";
import { serialize } from "@/lib/db/serialize";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookDetailsRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { book, conversations } = await loadBookPageData(params, userId);
  return <BookDetailsPage book={book} initialConversations={conversations} />;
}

async function loadBookPageData(params: Promise<{ slug: string }>, userId: string): Promise<{ book: BookDetailsRecord; conversations: ConversationRecord[] }> {
  try {
    const { slug } = await params;
    const book = serialize(await getBookDetailsBySlugForUser(slug, userId)) as BookDetailsRecord;
    const conversations = await new ConversationService().list(book.id, userId, 30).catch(() => []);
    return { book, conversations };
  } catch {
    notFound();
  }
}
