import "server-only";

import { del, put } from "@vercel/blob";
import { BookStorageError } from "@/features/books/errors/book-errors";
import type { UploadedFile } from "@/features/books/types/book-processing";
import type { StorageProvider } from "./storage-provider";

export class VercelBlobStorage implements StorageProvider {
  public uploadPdf(file: File, clerkId: string): Promise<UploadedFile> {
    return this.upload(file, "books", clerkId);
  }

  public uploadCover(file: File, clerkId: string): Promise<UploadedFile> {
    return this.upload(file, "covers", clerkId);
  }

  public async delete(key: string): Promise<void> {
    try {
      await del(key);
    } catch (error) {
      throw new BookStorageError("The book was removed, but its stored file could not be cleaned up.", { cause: error });
    }
  }

  private async upload(file: File, folder: "books" | "covers", clerkId: string): Promise<UploadedFile> {
    if (!file.name) throw new BookStorageError("The uploaded file must have a name.");
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new BookStorageError("Private file storage is not configured.");

    try {
      const blob = await put(`${folder}/${clerkId}-${sanitizeFileName(file.name)}`, file, {
        access: "private",
        addRandomSuffix: true,
        contentType: file.type || undefined,
      });
      return { key: blob.pathname, url: blob.url };
    } catch (error) {
      throw new BookStorageError("The uploaded file could not be stored.", { cause: error });
    }
  }
}

function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload";
}
