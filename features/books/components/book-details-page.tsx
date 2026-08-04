import { BookOpen, BrainCircuit, FileText, Layers3, Mic2, Sparkles } from "lucide-react";
import type { BookDetailsRecord } from "@/features/books/types/book";
import { BookCover } from "./book-cover";
import { BookDeleteButton } from "./book-delete-button";
import { PdfViewerContainer } from "./pdf-viewer-container";

const STATUS_LABELS = {
  UPLOADING: "Uploading",
  PROCESSING: "Processing text",
  PROCESSING_EMBEDDINGS: "Generating embeddings",
  READY: "Ready",
  FAILED: "Processing failed",
} as const;

const AI_FEATURES = [
  [BrainCircuit, "Chat With This Book", "Ask natural language questions about your uploaded book."],
  [FileText, "AI Summary", "Generate chapter and document summaries."],
  [Sparkles, "Key Takeaways", "Extract important concepts."],
  [Layers3, "Flashcards", "Generate study flashcards automatically."],
  [BookOpen, "Quiz", "Generate practice questions."],
  [Layers3, "Mind Map", "Visualize connected concepts."],
  [Mic2, "Voice Conversation", "Talk with your book."],
  [BrainCircuit, "Semantic Search", "Search using your book's embeddings."],
] as const;

export function BookDetailsPage({ book }: { book: BookDetailsRecord }) {
  const hasPdf = Boolean(book.fileBlobKey || (book.fileUrl && !book.fileUrl.includes("storage.local")));
  const coverUrl = book.coverBlobKey
    ? `/api/books/${encodeURIComponent(book.slug)}/cover`
    : book.coverUrl && !book.coverUrl.includes("storage.local")
      ? book.coverUrl
      : undefined;
  const uploadedDate = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(book.createdAt));

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="border-border bg-card h-fit overflow-hidden rounded-2xl border shadow-sm">
          <div className="bg-muted relative aspect-3/4">
            <BookCover src={coverUrl} title={book.title} />
          </div>
          <div className="space-y-4 p-5">
            <div><p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Book details</p><h1 className="mt-1 text-xl font-bold">{book.title}</h1><p className="text-muted-foreground mt-1">{book.author}</p></div>
            <dl className="text-sm"><Detail label="Voice persona" value={book.persona ?? "Default persona"} /><Detail label="Status" value={STATUS_LABELS[book.processingStatus]} /><Detail label="Uploaded" value={uploadedDate} /><Detail label="Pages" value="Not recorded" /><Detail label="Segments" value={String(book.totalSegments)} /><Detail label="Embedding model" value={book.embedding.model ?? "Not available"} /><Detail label="Dimensions" value={book.embedding.dimensions ? String(book.embedding.dimensions) : "Not available"} /></dl>
            <BookDeleteButton bookId={book.id} disabled={book.processingStatus !== "READY" && book.processingStatus !== "FAILED"} />
          </div>
        </aside>

        <div className="space-y-8">
          {hasPdf ? <PdfViewerContainer url={`/api/books/${encodeURIComponent(book.slug)}/file`} /> : <section className="border-border bg-card rounded-2xl border p-8 text-center"><FileText className="text-muted-foreground mx-auto size-9" /><h2 className="mt-3 font-semibold">PDF unavailable</h2><p className="text-muted-foreground mt-1 text-sm">This legacy book does not have a file that can be displayed.</p></section>}

          <section aria-labelledby="ai-features-heading"><div className="mb-4"><p className="text-primary text-sm font-semibold">On the roadmap</p><h2 id="ai-features-heading" className="mt-1 text-2xl font-bold">Upcoming AI features</h2><p className="text-muted-foreground mt-2">These tools will build on the book processing already completed.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{AI_FEATURES.map(([Icon, title, description]) => <article key={title} className="border-border bg-card rounded-xl border p-5"><Icon className="text-primary size-5" /><div className="mt-4 flex items-start justify-between gap-2"><h3 className="font-semibold">{title}</h3><span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-[11px] font-medium">Coming soon</span></div><p className="text-muted-foreground mt-2 text-sm leading-6">{description}</p><button type="button" disabled className="border-border text-muted-foreground mt-4 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-60">Coming soon</button></article>)}</div></section>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="border-border flex items-start justify-between gap-4 border-b py-2 last:border-b-0"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-36 text-right font-medium break-words">{value}</dd></div>;
}
