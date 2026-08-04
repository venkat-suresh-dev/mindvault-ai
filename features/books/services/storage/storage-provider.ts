import type { UploadedFile } from "@/features/books/types/book-processing";

export interface StorageProvider {
  uploadPdf(file: File, clerkId: string): Promise<UploadedFile>;
  uploadCover(file: File, clerkId: string): Promise<UploadedFile>;
  delete(key: string): Promise<void>;
}
