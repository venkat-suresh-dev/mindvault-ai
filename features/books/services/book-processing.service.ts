import "server-only";

import { BookValidationError } from "@/features/books/errors/book-errors";
import { deleteBookSegments } from "@/features/books/repositories/book-segment.repository";
import { updateBookProcessingStatus } from "@/features/books/repositories/book.repository";
import { createBookForUser, getBookForUser, saveBookSegmentsForUser } from "@/features/books/services/book.service";
import { ChunkService } from "@/features/books/services/chunk.service";
import { EmbeddingService } from "@/features/books/services/embedding.service";
import { LocalPlaceholderStorage, type StorageProvider } from "@/features/books/services/book-storage.service";
import { PdfService } from "@/features/books/services/pdf.service";
import type { BookRecord } from "@/features/books/types/book";
import { serialize } from "@/lib/db/serialize";

export interface ProcessBookUploadInput {
  title: string;
  author: string;
  persona: string;
  pdfFile: File;
  coverImage?: File;
}

export class BookProcessingService {
  public constructor(
    private readonly storage: StorageProvider = new LocalPlaceholderStorage(),
    private readonly pdfService = new PdfService(),
    private readonly chunkService = new ChunkService(),
    private readonly embeddingService = new EmbeddingService(),
  ) {}

  public async process(clerkId: string, input: ProcessBookUploadInput): Promise<BookRecord> {
    const uploadedKeys: string[] = [];
    let bookId: string | undefined;
    let segmentsSaved = false;

    try {
      const pdfUpload = await this.storage.uploadFile(input.pdfFile, "books");
      uploadedKeys.push(pdfUpload.key);
      const coverUpload = input.coverImage ? await this.storage.uploadFile(input.coverImage, "covers") : undefined;
      if (coverUpload) uploadedKeys.push(coverUpload.key);

      const extractedPdf = await this.pdfService.extract(input.pdfFile);
      const segments = this.chunkService.chunk(extractedPdf.pages);
      if (segments.length === 0) throw new BookValidationError("The PDF does not contain extractable text.");

      const book = await createBookForUser(clerkId, {
        title: input.title,
        author: input.author,
        persona: input.persona,
        fileUrl: pdfUpload.url,
        fileBlobKey: pdfUpload.key,
        coverUrl: coverUpload?.url,
        coverBlobKey: coverUpload?.key,
        fileSize: input.pdfFile.size,
      });
      bookId = book._id.toString();

      await updateBookProcessingStatus(bookId, "PROCESSING");
      await saveBookSegmentsForUser(bookId, clerkId, segments);
      segmentsSaved = true;
      await updateBookProcessingStatus(bookId, "PROCESSING_EMBEDDINGS");
      await this.embeddingService.embedBookSegments(bookId);
      await updateBookProcessingStatus(bookId, "READY");
      return serialize(await getBookForUser(bookId, clerkId)) as BookRecord;
    } catch (error) {
      if (bookId) {
        await this.markFailed(bookId, !segmentsSaved);
      } else {
        await this.deleteUploadedFiles(uploadedKeys);
      }
      throw error;
    }
  }

  private async markFailed(bookId: string, deleteSegmentsForRecovery: boolean): Promise<void> {
    const recoveryTasks: Promise<unknown>[] = [updateBookProcessingStatus(bookId, "FAILED")];
    if (deleteSegmentsForRecovery) recoveryTasks.push(deleteBookSegments(bookId));
    await Promise.allSettled(recoveryTasks);
  }

  private async deleteUploadedFiles(keys: string[]): Promise<void> {
    await Promise.allSettled(keys.map((key) => this.storage.deleteFile(key)));
  }
}
