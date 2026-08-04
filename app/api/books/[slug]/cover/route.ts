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
    const blob = await access.getPrivateBlob(book, clerkId, "cover");

    if (blob?.statusCode === 200) {
      const headers = new Headers({
        "Cache-Control": "private, no-store",
        "Content-Type": blob.headers.get("content-type") ?? "image/*",
      });
      const length = blob.headers.get("content-length");
      if (length) headers.set("Content-Length", length);
      return new NextResponse(blob.stream, { headers });
    }

    const legacyUrl = access.getLegacyUrl(book, clerkId, "cover");
    if (legacyUrl) return NextResponse.redirect(legacyUrl);
    return new NextResponse("Cover not found.", { status: 404 });
  } catch {
    return new NextResponse("Not found.", { status: 404 });
  }
}
