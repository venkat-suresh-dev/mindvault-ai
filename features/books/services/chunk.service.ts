import { BOOK_PROCESSING_CONFIG } from "@/features/books/constants/book-upload";
import type { ChunkOptions, ExtractedPdfPage, ProcessedBookSegment } from "@/features/books/types/book-processing";

interface WordWithPage {
  pageNumber: number;
  value: string;
}

export class ChunkService {
  public chunk(pages: ExtractedPdfPage[], options: ChunkOptions = BOOK_PROCESSING_CONFIG): ProcessedBookSegment[] {
    if (options.chunkSizeWords <= 0 || options.chunkOverlapWords < 0 || options.chunkOverlapWords >= options.chunkSizeWords) {
      throw new RangeError("Chunk overlap must be non-negative and smaller than chunk size.");
    }

    const words: WordWithPage[] = pages.flatMap((page) =>
      page.text.split(/\s+/).filter(Boolean).map((value) => ({ pageNumber: page.pageNumber, value })),
    );
    const segments: ProcessedBookSegment[] = [];
    const stride = options.chunkSizeWords - options.chunkOverlapWords;

    for (let start = 0; start < words.length; start += stride) {
      const chunk = words.slice(start, start + options.chunkSizeWords);
      if (chunk.length === 0) break;
      const text = chunk.map((word) => word.value).join(" ");
      segments.push({
        segmentIndex: segments.length,
        pageNumber: chunk[0].pageNumber,
        text,
        wordCount: chunk.length,
        characterCount: text.length,
      });
      if (start + options.chunkSizeWords >= words.length) break;
    }
    return segments;
  }
}
