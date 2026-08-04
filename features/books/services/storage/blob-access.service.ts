import "server-only";

import { get, type GetBlobResult } from "@vercel/blob";
import { BookStorageError, UnauthorizedBookAccessError } from "@/features/books/errors/book-errors";
import type { BookRecord } from "@/features/books/types/book";

export type BookBlobAsset = "pdf" | "cover";

export class BlobAccessService {
  public async getPrivateBlob(book: BookRecord, clerkId: string, asset: BookBlobAsset): Promise<GetBlobResult | null> {
    if (book.clerkId !== clerkId) throw new UnauthorizedBookAccessError();
    const key = asset === "pdf" ? book.fileBlobKey : book.coverBlobKey;
    if (!key) return null;

    try {
      return await get(key, { access: "private" });
    } catch (error) {
      throw new BookStorageError("The stored file is unavailable.", { cause: error });
    }
  }

  public getLegacyUrl(book: BookRecord, clerkId: string, asset: BookBlobAsset): string | undefined {
    if (book.clerkId !== clerkId) throw new UnauthorizedBookAccessError();
    const url = asset === "pdf" ? book.fileUrl : book.coverUrl;
    return url && !url.includes("storage.local") ? url : undefined;
  }
}
