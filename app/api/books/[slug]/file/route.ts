import { requireAuthenticatedBookUser } from "@/features/books/actions/book-action-helpers";
import { getBookBySlugForUser } from "@/features/books/services/book.service";
import { BlobAccessService } from "@/features/books/services/storage";
import type { BookRecord } from "@/features/books/types/book";
import { serialize } from "@/lib/db/serialize";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const clerkId = await requireAuthenticatedBookUser();
    const { slug } = await params;
    const book = serialize(await getBookBySlugForUser(slug, clerkId)) as BookRecord;
    const access = new BlobAccessService();
    const blob = await access.getPrivateBlob(book, clerkId, "pdf");

    if (blob?.statusCode === 200) {
      return new NextResponse(blob.stream, {
        headers: responseHeaders(blob.headers, "application/pdf", "inline"),
      });
    }

    const legacyUrl = access.getLegacyUrl(book, clerkId, "pdf");
    if (legacyUrl) return NextResponse.redirect(legacyUrl);
    return new NextResponse("PDF not found.", { status: 404 });
  } catch {
    return new NextResponse("Not found.", { status: 404 });
  }
}

function responseHeaders(headers: { get(name: string): string | null }, fallbackType: string, disposition: "inline" | "attachment") {
  const result = new Headers({
    "Cache-Control": "private, no-store",
    "Content-Type": headers.get("content-type") ?? fallbackType,
    "Content-Disposition": headers.get("content-disposition") ?? disposition,
  });
  const length = headers.get("content-length");
  if (length) result.set("Content-Length", length);
  return result;
}
