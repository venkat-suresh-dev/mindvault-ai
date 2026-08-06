import "server-only";

import { BOOK_UPLOAD_LIMITS } from "@/features/books/constants/book-upload";
import { PdfProcessingError } from "@/features/books/errors/book-errors";
import type { ExtractedPdfPage, PdfMetadata } from "@/features/books/types/book-processing";
import { getDocumentProxy, getMeta } from "unpdf";
import { log, safeErrorMetadata } from "@/lib/observability/logger";

export class PdfService {
  public async extractPages(file: File, onPages: (pages: ExtractedPdfPage[]) => Promise<void>, windowSize = 16, startPage = 1): Promise<PdfMetadata> {
    if (file.size > BOOK_UPLOAD_LIMITS.pdfBytes) throw new PdfProcessingError(`PDF files are limited to ${formatBytes(BOOK_UPLOAD_LIMITS.pdfBytes)}.`);
    try {
      const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
      if (pdf.numPages === 0) throw new PdfProcessingError("The uploaded PDF has no pages.");
      if (pdf.numPages > BOOK_UPLOAD_LIMITS.pdfPages) throw new PdfProcessingError(`PDF files are limited to ${BOOK_UPLOAD_LIMITS.pdfPages} pages.`);
      const metadata = extractMetadata((await getMeta(pdf)).info);
      for (let start = Math.max(1, startPage); start <= pdf.numPages; start += windowSize) {
        const pages: ExtractedPdfPage[] = [];
        for (let pageNumber = start; pageNumber < Math.min(start + windowSize, pdf.numPages + 1); pageNumber += 1) {
          const content = await pdf.getPage(pageNumber).then((page) => page.getTextContent());
          const text = normalizeText(content.items.map((item) => isTextItem(item) ? item.str : "").join(" "));
          if (text) pages.push({ pageNumber, text });
        }
        if (pages.length > 0) await onPages(pages);
      }
      return { ...metadata, pageCount: pdf.numPages };
    } catch (error) {
      log("error", "book.pdf_processing.failed", safeErrorMetadata(error));
      if (error instanceof PdfProcessingError) throw error;
      throw new PdfProcessingError("Unable to process PDF.", { cause: error });
    }
  }

}

function isTextItem(value: unknown): value is { str: string } { return typeof value === "object" && value !== null && "str" in value && typeof value.str === "string"; }

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
