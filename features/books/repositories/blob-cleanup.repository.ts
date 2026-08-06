import { BlobCleanupModel } from "@/features/books/models/blob-cleanup.model";
import { connectToDatabase } from "@/lib/db/connection";

export async function recordBlobCleanupFailure(bookId: string, clerkId: string, blobKey: string, errorClassification: string): Promise<void> {
  await connectToDatabase();
  await BlobCleanupModel.updateOne({ bookId, clerkId, blobKey }, { $set: { status: "FAILED", errorClassification, lastErrorAt: new Date() }, $inc: { retryCount: 1 }, $setOnInsert: { bookId, clerkId, blobKey } }, { upsert: true });
}
export async function removeBlobCleanupRecord(bookId: string, clerkId: string, blobKey: string): Promise<void> {
  await connectToDatabase();
  await BlobCleanupModel.deleteOne({ bookId, clerkId, blobKey });
}
