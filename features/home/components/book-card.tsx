"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteBook } from "@/features/books/actions/delete-book";
import { VOICE_PERSONAS } from "@/features/books/constants/voice-personas";
import type { LibraryBook } from "@/features/home/types/home";
import { BookOpen, LoaderCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface BookCardProps {
  book: LibraryBook;
}

const STATUS_LABELS = {
  UPLOADING: "Uploading",
  PROCESSING: "Processing text",
  PROCESSING_EMBEDDINGS: "Generating AI embeddings",
  READY: "Ready to chat",
  FAILED: "Processing failed",
} as const;

function getPersonaName(persona: string | null | undefined): string {
  return VOICE_PERSONAS.find((option) => option.id === persona)?.name ?? "Default persona";
}

function formatUploadDate(date: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(date),
  );
}

export function BookCard({ book }: BookCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [error, setError] = useState<string>();
  const [hasCover, setHasCover] = useState(Boolean(book.coverBlobKey || (book.coverUrl && !book.coverUrl.includes("storage.local"))));
  const [isDeleting, startTransition] = useTransition();
  const canDelete = book.processingStatus === "READY" || book.processingStatus === "FAILED";
  const coverSource = book.coverBlobKey
    ? `/api/books/${encodeURIComponent(book.slug)}/cover`
    : book.coverUrl && !book.coverUrl.includes("storage.local")
      ? book.coverUrl
      : undefined;

  if (isRemoved) return null;

  const handleDelete = () => {
    if (isDeleting || !canDelete) return;

    setError(undefined);
    setIsOpen(false);
    setIsRemoved(true);
    startTransition(async () => {
      const result = await deleteBook(book.id);
      if (!result.success) {
        setIsRemoved(false);
        setError(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <article className="border-border bg-card group relative overflow-hidden rounded-xl border transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <Link href={`/books/${book.slug}`} className="block focus-visible:outline-none" aria-label={`Open ${book.title} by ${book.author}`}>
        <figure>
          <div className="bg-muted relative aspect-3/4 overflow-hidden">
            {hasCover && coverSource ? (
              // The protected route requires browser authentication; Next Image optimization cannot forward Clerk cookies.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverSource}
                alt={`Cover of ${book.title}`}
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                onError={() => setHasCover(false)}
              />
            ) : (
              <div className="from-primary/20 via-muted to-background flex size-full flex-col items-center justify-center bg-gradient-to-br p-4 text-center">
                <BookOpen className="text-primary size-9" aria-hidden="true" />
                <span className="mt-3 line-clamp-3 text-sm font-semibold">{book.title}</span>
              </div>
            )}
          </div>

          <figcaption className="p-3">
            <h3 className="truncate text-sm font-semibold">{book.title}</h3>
            <p className="text-muted-foreground mt-1 truncate text-sm">{book.author}</p>
            <p className="text-muted-foreground mt-3 truncate text-xs">{getPersonaName(book.persona)}</p>
            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              <time className="text-muted-foreground" dateTime={book.createdAt}>{formatUploadDate(book.createdAt)}</time>
              <span className={book.processingStatus === "READY" ? "text-primary font-medium" : "text-muted-foreground"}>
                {STATUS_LABELS[book.processingStatus]}
              </span>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">{book.totalSegments} segments</p>
          </figcaption>
        </figure>
      </Link>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="bg-background/90 hover:bg-destructive/10 hover:text-destructive absolute top-2 right-2 opacity-0 shadow-sm group-hover:opacity-100 focus-visible:opacity-100"
            disabled={!canDelete || isDeleting}
            aria-label={canDelete ? `Delete ${book.title}` : "Delete is available when processing finishes"}
          >
            {isDeleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <div className="space-y-2">
            <AlertDialogTitle>Delete {book.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the book, its AI segments, PDF, and cover image. This action cannot be undone.
            </AlertDialogDescription>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <LoaderCircle className="animate-spin" />}
              Delete book
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p role="alert" className="text-destructive px-3 pb-3 text-xs">{error}</p>}
    </article>
  );
}
