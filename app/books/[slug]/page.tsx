import { BookDetailsPage } from "@/features/books/components/book-details-page";
import { getBookDetailsBySlugForUser } from "@/features/books/services/book.service";
import type { BookDetailsRecord } from "@/features/books/types/book";
import { serialize } from "@/lib/db/serialize";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookDetailsRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const book = await loadBook(params, userId);
  return <BookDetailsPage book={book} />;
}

async function loadBook(params: Promise<{ slug: string }>, userId: string): Promise<BookDetailsRecord> {
  try {
    const { slug } = await params;
    return serialize(await getBookDetailsBySlugForUser(slug, userId)) as BookDetailsRecord;
  } catch {
    notFound();
  }
}
