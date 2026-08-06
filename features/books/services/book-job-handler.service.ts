import "server-only";

import { BookProcessingService } from "@/features/books/services/book-processing.service";
import type { DurableJobCheckpoint } from "@/features/jobs/types/durable-job";

export class BookJobHandler {
  public async run(bookId: string, clerkId: string, assertLease: () => Promise<void>, signal: AbortSignal, checkpoint: DurableJobCheckpoint, saveCheckpoint: (checkpoint: DurableJobCheckpoint) => Promise<void>): Promise<void> {
    await new BookProcessingService().processStored(bookId, clerkId, assertLease, signal, checkpoint, saveCheckpoint);
  }
}
