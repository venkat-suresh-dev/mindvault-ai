import "server-only";

import { BOOK_UPLOAD_LIMITS } from "@/features/books/constants/book-upload";
import { PdfProcessingError } from "@/features/books/errors/book-errors";
import type {
  ExtractedPdf,
  PdfMetadata,
} from "@/features/books/types/book-processing";
import { extractText, getDocumentProxy, getMeta } from "unpdf";

export class PdfService {
  public async extract(file: File): Promise<ExtractedPdf> {
    if (file.size > BOOK_UPLOAD_LIMITS.pdfBytes) {
      throw new PdfProcessingError(
        `PDF files are limited to ${formatBytes(BOOK_UPLOAD_LIMITS.pdfBytes)}.`,
      );
    }

    try {
      const buffer = await file.arrayBuffer();
      // Initialize the unpdf proxy which safely wraps PDF.js in any environment
      const pdf = await getDocumentProxy(new Uint8Array(buffer));

      // 1. Extract Metadata using unpdf's helper
      const metaDataResult = await getMeta(pdf);
      const metadata = extractMetadata(metaDataResult.info);

      // 2. Extract Text
      // Passing mergePages: false instructs unpdf to return a string array (one per page)
      const { totalPages, text } = await extractText(pdf, {
        mergePages: false,
      });

      if (totalPages === 0 || text.length === 0) {
        throw new PdfProcessingError("The uploaded PDF has no pages.");
      }

      if (totalPages > BOOK_UPLOAD_LIMITS.pdfPages) {
        throw new PdfProcessingError(
          `PDF files are limited to ${BOOK_UPLOAD_LIMITS.pdfPages} pages.`,
        );
      }

      // 3. Process and clean the text array into our required page objects
      const validPages = (text as string[])
        .map((pageText, index) => ({
          pageNumber: index + 1,
          text: normalizeText(pageText),
        }))
        .filter((page) => page.text.length > 0);

      if (validPages.length === 0) {
        throw new PdfProcessingError(
          "The uploaded PDF does not contain extractable text.",
        );
      }

      return {
        metadata: {
          ...metadata,
          pageCount: totalPages,
        },
        pages: validPages,
      };
    } catch (error) {
      console.error("PDF PROCESSING ERROR:", error);

      if (error instanceof PdfProcessingError) {
        throw error;
      }

      throw new PdfProcessingError("Unable to process PDF.", {
        cause: error,
      });
    }
  }
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function extractMetadata(
  info: Record<string, unknown>,
): Omit<PdfMetadata, "pageCount"> {
  return {
    title: stringMetadata(info?.Title),
    author: stringMetadata(info?.Author),
  };
}

function stringMetadata(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${Math.round(kilobytes)} KB`;
  }
  const megabytes = kilobytes / 1024;
  return `${Math.round(megabytes)} MB`;
}
