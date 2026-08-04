import "server-only";

import { BookStorageError } from "@/features/books/errors/book-errors";
import type { UploadedFile } from "@/features/books/types/book-processing";

export interface StorageProvider {
  uploadFile(file: File, pathPrefix: string): Promise<UploadedFile>;
  deleteFile(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

export class LocalPlaceholderStorage implements StorageProvider {
  public async uploadFile(file: File, pathPrefix: string): Promise<UploadedFile> {
    if (!file.name) throw new BookStorageError("The uploaded file must have a name.");

    const key = `${pathPrefix}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    return { key, url: this.getPublicUrl(key) };
  }

  public async deleteFile(): Promise<void> {}

  public getPublicUrl(key: string): string {
    return `https://storage.local/${key}`;
  }
}

function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload";
}
