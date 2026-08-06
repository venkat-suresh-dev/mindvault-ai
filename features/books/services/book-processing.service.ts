import "server-only";

import { BookValidationError } from "@/features/books/errors/book-errors";
import { deleteBookSegments } from "@/features/books/repositories/book-segment.repository";
import { updateBookProcessingStatus } from "@/features/books/repositories/book.repository";
import { createBookForUser, getBookForUser, saveBookSegmentsForUser } from "@/features/books/services/book.service";
import { ChunkAccumulator } from "@/features/books/services/chunk.service";
import { EmbeddingService } from "@/features/books/services/embedding.service";
import { type StorageProvider, VercelBlobStorage } from "@/features/books/services/storage";
import { PdfService } from "@/features/books/services/pdf.service";
import type { BookRecord } from "@/features/books/types/book";
import { serialize } from "@/lib/db/serialize";
import { JobService } from "@/features/jobs/services/job.service";
import { aiConfig } from "@/lib/config/ai.config";
import type { DurableJobCheckpoint } from "@/features/jobs/types/durable-job";

export interface ProcessBookUploadInput {
  title: string;
  author: string;
  persona: string;
  pdfFile: File;
  coverImage?: File;
}

export interface QueuedPdfUploadInput { title: string; author: string; persona: string; pdfUpload: { key: string; url: string; size: number } }

export class BookProcessingService {
  public constructor(
    private readonly storage: StorageProvider = new VercelBlobStorage(),
    private readonly pdfService = new PdfService(),
    private readonly embeddingService = new EmbeddingService(),
  ) {}

  public async queue(clerkId: string, input: ProcessBookUploadInput): Promise<BookRecord> {
    const uploadedKeys: string[] = [];
    try {
      const pdfUpload = await this.storage.uploadPdf(input.pdfFile, clerkId);
      uploadedKeys.push(pdfUpload.key);
      const coverUpload = input.coverImage ? await this.storage.uploadCover(input.coverImage, clerkId) : undefined;
      if (coverUpload) uploadedKeys.push(coverUpload.key);
      const book = await createBookForUser(clerkId, { title: input.title, author: input.author, persona: input.persona, fileBlobKey: pdfUpload.key, coverBlobKey: coverUpload?.key, fileSize: input.pdfFile.size });
      await new JobService().enqueueBookProcessing(book._id.toString(), clerkId);
      return serialize(book) as BookRecord;
    } catch (error) {
      await this.deleteUploadedFiles(uploadedKeys);
      throw error;
    }
  }

  public async queueUploadedPdf(clerkId: string, input: QueuedPdfUploadInput): Promise<BookRecord> {
    if (!input.pdfUpload.key.startsWith(`books/${clerkId}-`)) throw new BookValidationError("The uploaded PDF does not belong to this user.");
    const book = await createBookForUser(clerkId, { title: input.title, author: input.author, persona: input.persona, fileBlobKey: input.pdfUpload.key, fileSize: input.pdfUpload.size });
    await new JobService().enqueueBookProcessing(book._id.toString(), clerkId);
    return serialize(book) as BookRecord;
  }

  public async processStored(bookId: string, clerkId: string, assertLease: () => Promise<void>, signal: AbortSignal, checkpoint: DurableJobCheckpoint = {}, saveCheckpoint: (checkpoint: DurableJobCheckpoint) => Promise<void> = async () => undefined): Promise<void> {
    const book = await getBookForUser(bookId, clerkId);
    if (!book.fileBlobKey) throw new BookValidationError("The book PDF is unavailable.");
    if (book.totalSegments === 0) {
      await updateBookProcessingStatus(bookId, "PROCESSING");
      throwIfAborted(signal);
      const pdfFile = await this.storage.downloadPdf(book.fileBlobKey);
      const accumulator = new ChunkAccumulator(undefined, checkpoint.nextSegmentIndex ?? book.totalSegments);
      let saved = 0;
      let nextSegmentIndex = checkpoint.nextSegmentIndex ?? book.totalSegments;
      const persist = async (segments: ReturnType<ChunkAccumulator["push"]>) => {
        for (let offset = 0; offset < segments.length; offset += aiConfig.embeddings.batchSize) {
          throwIfAborted(signal); await assertLease();
          await saveBookSegmentsForUser(bookId, clerkId, segments.slice(offset, offset + aiConfig.embeddings.batchSize));
          saved += segments.slice(offset, offset + aiConfig.embeddings.batchSize).length;
          nextSegmentIndex = segments[offset + Math.min(aiConfig.embeddings.batchSize, segments.length - offset) - 1].segmentIndex + 1;
          await saveCheckpoint({ phase: "CHUNKING", nextSegmentIndex, lastProcessedPage: checkpoint.lastProcessedPage, completedBatches: saved });
        }
      };
      await this.pdfService.extractPages(pdfFile, async (pages) => { throwIfAborted(signal); await assertLease(); await persist(accumulator.push(pages)); await saveCheckpoint({ phase: "CHUNKING", nextSegmentIndex, lastProcessedPage: pages[pages.length - 1].pageNumber, completedBatches: saved }); }, 16, (checkpoint.lastProcessedPage ?? 0) + 1);
      await persist(accumulator.finish());
      if (saved === 0 && book.totalSegments === 0) throw new BookValidationError("The PDF does not contain extractable text.");
    }
    await assertLease();
    await updateBookProcessingStatus(bookId, "PROCESSING_EMBEDDINGS");
    await this.embeddingService.embedBookSegments(bookId, clerkId, { signal, assertLease });
    await assertLease();
    await updateBookProcessingStatus(bookId, "READY");
  }

  private async markFailed(bookId: string, deleteSegmentsForRecovery: boolean): Promise<void> {
    const recoveryTasks: Promise<unknown>[] = [updateBookProcessingStatus(bookId, "FAILED")];
    if (deleteSegmentsForRecovery) recoveryTasks.push(deleteBookSegments(bookId));
    await Promise.allSettled(recoveryTasks);
  }

  private async deleteUploadedFiles(keys: string[]): Promise<void> {
    await Promise.allSettled(keys.map((key) => this.storage.delete(key)));
  }
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException("Book processing was cancelled.", "AbortError");
}
