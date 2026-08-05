"use client";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  LoaderCircle,
  Maximize,
  Minimize,
  Minus,
  Plus,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageCount, setPageCount] = useState<number>();
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const onLoadSuccess = ({ numPages }: PDFDocumentProxy) => {
    setPageCount(numPages);
    setPage((currentPage) => Math.min(currentPage, numPages));
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === viewerRef.current) {
        await document.exitFullscreen();
        return;
      }

      await viewerRef.current?.requestFullscreen();
    } catch {
      // Fullscreen can be unavailable in embedded browsers or restricted contexts.
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <section
      ref={viewerRef}
      aria-labelledby="pdf-viewer-heading"
      className={
        isFullscreen
          ? "border-border bg-background flex h-dvh flex-col overflow-hidden border shadow-sm"
          : "border-border bg-card overflow-hidden rounded-2xl border shadow-sm"
      }
    >
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <button type="button" onClick={() => setIsCollapsed((value) => !value)} aria-expanded={!isCollapsed} className="flex items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {isCollapsed ? <ChevronRightIcon className="size-4" /> : <ChevronDown className="size-4" />}
            <span id="pdf-viewer-heading">Read PDF</span>
          </button>
          {!isCollapsed ? <p className="text-muted-foreground mt-1 text-sm">Your document is delivered through a protected connection.</p> : null}
        </div>
        {!isCollapsed ? <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={toggleFullscreen}
            aria-label={
              isFullscreen
                ? "Exit fullscreen PDF viewer"
                : "Enter fullscreen PDF viewer"
            }
          >
            {isFullscreen ? <Minimize /> : <Maximize />}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setScale((value) => Math.max(0.6, value - 0.1))}
            aria-label="Zoom out"
          >
            <Minus />
          </Button>
          <span className="text-muted-foreground min-w-14 text-center text-xs">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setScale((value) => Math.min(1.8, value + 0.1))}
            aria-label="Zoom in"
          >
            <Plus />
          </Button>
        </div> : null}
      </div>
      {!isCollapsed ? <><div
        className={
          isFullscreen
            ? "bg-muted/40 min-h-0 flex-1 overflow-auto p-4"
            : "bg-muted/40 max-h-[70vh] overflow-auto p-4"
        }
      >
        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          loading={
            <div className="text-muted-foreground flex min-h-72 items-center justify-center gap-2 text-sm">
              <LoaderCircle className="size-4 animate-spin" />
              Loading protected PDF…
            </div>
          }
          error={
            <div
              role="alert"
              className="text-destructive min-h-72 p-6 text-center text-sm"
            >
              This PDF could not be loaded. It may have been removed or is
              unavailable.
            </div>
          }
        >
          <div className="mx-auto w-fit shadow-lg">
            <Page
              pageNumber={page}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer
            />
          </div>
        </Document>
      </div>
      {pageCount && (
        <div className="border-border flex items-center justify-center gap-3 border-t p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1}
          >
            <ChevronLeft />
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            disabled={page === pageCount}
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      )}</> : null}
    </section>
  );
}
