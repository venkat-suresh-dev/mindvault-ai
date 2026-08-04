import type { BookSegmentInput } from "./book";

export interface UploadedFile {
  key: string;
  url: string;
}

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
}

export interface PdfMetadata {
  pageCount: number;
  title?: string;
  author?: string;
}

export interface ExtractedPdf {
  metadata: PdfMetadata;
  pages: ExtractedPdfPage[];
}

export interface ChunkOptions {
  chunkSizeWords: number;
  chunkOverlapWords: number;
}

export type ProcessedBookSegment = BookSegmentInput;
