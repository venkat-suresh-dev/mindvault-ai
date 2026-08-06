import type { BookDetailsRecord } from "@/features/books/types/book";
import { ConversationWorkspace } from "@/features/conversations/components/conversation-workspace";
import type { ConversationRecord } from "@/features/conversations/types/conversation";
import { KnowledgeWorkspace } from "@/features/knowledge/components/knowledge-workspace";
import {
  Brain,
  CalendarDays,
  CheckCircle2,
  FileText,
  Layers3,
  MicVocal,
} from "lucide-react";
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

export function BookDetailsPage({ book, initialConversations }: { book: BookDetailsRecord; initialConversations: ConversationRecord[] }) {
  const hasPdf = Boolean(
    book.fileBlobKey ||
    (book.fileUrl && !book.fileUrl.includes("storage.local")),
  );
  const coverUrl = book.coverBlobKey
    ? `/api/books/${encodeURIComponent(book.slug)}/cover`
    : book.coverUrl && !book.coverUrl.includes("storage.local")
      ? book.coverUrl
      : undefined;
  const uploadedDate = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(book.createdAt));

  return (
    <main className="container mx-auto max-w-[90rem] px-4 py-6 sm:px-6 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[272px_minmax(0,1fr)] xl:items-start">
        <aside className="border-border bg-card h-fit overflow-hidden rounded-2xl border shadow-sm xl:sticky xl:top-6">
          <div className="bg-muted relative aspect-3/4">
            <BookCover src={coverUrl} title={book.title} author={book.author} />
          </div>
          <div className="space-y-5 p-5">
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Your knowledge source
              </p>
              <h1 className="mt-1 text-xl leading-7 font-bold">{book.title}</h1>
              <p className="text-muted-foreground mt-1">{book.author}</p>
            </div>
            <div className="border-border flex flex-wrap gap-2 border-y py-4">
              <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
                <CheckCircle2 className="size-3.5" />
                {STATUS_LABELS[book.processingStatus]}
              </span>
              <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
                <Layers3 className="size-3.5" />
                {book.totalSegments} segments
              </span>
            </div>
            <dl className="space-y-3 text-sm">
              <Detail icon={Brain} label="Embedding space" value={book.embedding.dimensions ? `${book.embedding.dimensions} dimensions` : "Not available"} />
              <Detail icon={CalendarDays} label="Uploaded" value={uploadedDate} />
              <Detail icon={MicVocal} label="Voice" value={book.persona ?? "Default persona"} />
            </dl>
            <BookDeleteButton bookId={book.id} />
          </div>
        </aside>

        <div className="space-y-6">
          <ConversationWorkspace
            slug={book.slug}
            bookTitle={book.title}
            disabled={book.processingStatus !== "READY"}
            initialConversations={initialConversations}
          />
          {hasPdf ? (
            <PdfViewerContainer
              url={`/api/books/${encodeURIComponent(book.slug)}/file`}
            />
          ) : (
            <section className="border-border bg-card rounded-2xl border p-8 text-center">
              <FileText className="text-muted-foreground mx-auto size-9" />
              <h2 className="mt-3 font-semibold">PDF unavailable</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                This legacy book does not have a file that can be displayed.
              </p>
            </section>
          )}

          <KnowledgeWorkspace slug={book.slug} disabled={book.processingStatus !== "READY"} />
        </div>
      </div>
    </main>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof Brain; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-muted text-muted-foreground mt-0.5 rounded-md p-1.5"><Icon className="size-3.5" /></span>
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="mt-0.5 font-medium wrap-break-word">{value}</dd>
      </div>
    </div>
  );
}
