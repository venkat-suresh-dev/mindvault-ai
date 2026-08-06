import type { StorageProvider } from "./storage-provider";
import { recordBlobCleanupFailure, removeBlobCleanupRecord } from "@/features/books/repositories/blob-cleanup.repository";

export class BlobCleanupService {
  public async delete(bookId: string, clerkId: string, blobKey: string, storage: StorageProvider): Promise<void> {
    try { await storage.delete(blobKey); await removeBlobCleanupRecord(bookId, clerkId, blobKey); }
    catch { await recordBlobCleanupFailure(bookId, clerkId, blobKey, "STORAGE_DELETE_FAILED"); }
  }
}
