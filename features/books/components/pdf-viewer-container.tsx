"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("./pdf-viewer").then((module) => module.PdfViewer), {
  ssr: false,
  loading: () => <div className="text-muted-foreground border-border rounded-xl border p-6 text-sm">Loading PDF viewer…</div>,
});

export function PdfViewerContainer({ url }: { url: string }) {
  return <PdfViewer url={url} />;
}
