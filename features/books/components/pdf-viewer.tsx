"use client";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LoaderCircle, Minus, Plus } from "lucide-react";
import { useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [pageCount, setPageCount] = useState<number>();
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);

  const onLoadSuccess = ({ numPages }: PDFDocumentProxy) => {
    setPageCount(numPages);
    setPage((currentPage) => Math.min(currentPage, numPages));
  };

  return (
    <section aria-labelledby="pdf-viewer-heading" className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 id="pdf-viewer-heading" className="font-semibold">Read the PDF</h2>
          <p className="text-muted-foreground text-sm">Your document is delivered through a protected connection.</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setScale((value) => Math.max(0.6, value - 0.1))} aria-label="Zoom out"><Minus /></Button>
          <span className="text-muted-foreground min-w-14 text-center text-xs">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="icon-sm" onClick={() => setScale((value) => Math.min(1.8, value + 0.1))} aria-label="Zoom in"><Plus /></Button>
        </div>
      </div>
      <div className="bg-muted/40 max-h-[70vh] overflow-auto p-4">
        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          loading={<div className="text-muted-foreground flex min-h-72 items-center justify-center gap-2 text-sm"><LoaderCircle className="size-4 animate-spin" />Loading protected PDF…</div>}
          error={<div role="alert" className="text-destructive min-h-72 p-6 text-center text-sm">This PDF could not be loaded. It may have been removed or is unavailable.</div>}
        >
          <div className="mx-auto w-fit shadow-lg">
            <Page pageNumber={page} scale={scale} renderTextLayer renderAnnotationLayer />
          </div>
        </Document>
      </div>
      {pageCount && (
        <div className="border-border flex items-center justify-center gap-3 border-t p-3">
          <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}><ChevronLeft />Previous</Button>
          <span className="text-muted-foreground text-sm">Page {page} of {pageCount}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page === pageCount}>Next<ChevronRight /></Button>
        </div>
      )}
    </section>
  );
}
