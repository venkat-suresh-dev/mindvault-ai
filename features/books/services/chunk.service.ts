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

export class ChunkAccumulator {
  private readonly words: WordWithPage[] = [];
  private nextSegmentIndex: number;
  public constructor(private readonly options: ChunkOptions = BOOK_PROCESSING_CONFIG, startSegmentIndex = 0) { this.nextSegmentIndex = startSegmentIndex; }
  public push(pages: ExtractedPdfPage[]): ProcessedBookSegment[] {
    for (const page of pages) this.words.push(...page.text.split(/\s+/).filter(Boolean).map((value) => ({ pageNumber: page.pageNumber, value })));
    return this.drain(false);
  }
  public finish(): ProcessedBookSegment[] { return this.drain(true); }
  private drain(final: boolean): ProcessedBookSegment[] {
    const result: ProcessedBookSegment[] = [];
    const stride = this.options.chunkSizeWords - this.options.chunkOverlapWords;
    while (this.words.length >= this.options.chunkSizeWords || (final && this.words.length > this.options.chunkOverlapWords)) {
      const chunk = this.words.slice(0, Math.min(this.options.chunkSizeWords, this.words.length));
      const text = chunk.map((word) => word.value).join(" ");
      result.push({ segmentIndex: this.nextSegmentIndex++, pageNumber: chunk[0].pageNumber, text, wordCount: chunk.length, characterCount: text.length });
      if (chunk.length < this.options.chunkSizeWords) { this.words.length = 0; break; }
      this.words.splice(0, stride);
    }
    return result;
  }
}
