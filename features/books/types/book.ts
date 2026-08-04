import type { VoicePersonaId } from "@/features/books/constants/voice-personas";
import type { BookProcessingStatus } from "@/features/books/models/book.model";
import type { ActionResult } from "@/lib/db/action-result";

export interface BookInput {
  title: string;
  author: string;
  pdfFile: File;
  coverImage?: File;
  voicePersona: VoicePersonaId;
}

export interface Book {
  id: string;
  ownerId: string;
  title: string;
  author: string;
  slug: string;
  coverUrl?: string;
  fileUrl?: string;
  voicePersona: VoicePersonaId;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookInput {
  title: string;
  author: string;
  persona?: string;
  fileUrl?: string;
  fileBlobKey: string;
  coverUrl?: string;
  coverBlobKey?: string;
  fileSize: number;
}

export interface BookRecord {
  id: string;
  clerkId: string;
  title: string;
  normalizedTitle: string;
  slug: string;
  author: string;
  persona?: string | null;
  fileUrl?: string | null;
  fileBlobKey?: string | null;
  coverUrl?: string | null;
  coverBlobKey?: string | null;
  fileSize: number;
  totalSegments: number;
  processingStatus: BookProcessingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BookDetailsRecord extends BookRecord {
  embedding: {
    model?: string;
    dimensions?: number;
  };
}

export interface BookSegmentInput {
  segmentIndex: number;
  pageNumber: number;
  text: string;
  wordCount: number;
  characterCount: number;
}

export interface SaveBookSegmentsInput {
  bookId: string;
  segments: BookSegmentInput[];
}

export type BookActionResult<T> = ActionResult<T>;
