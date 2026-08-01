import type { Book } from "@/features/home/types/home";
import { BookOpen, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link
      href={`/books/${book.slug}`}
      className="group border-border bg-card focus-visible:ring-ring hover:border-primary/40 block overflow-hidden rounded-xl border transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={`Open ${book.title} by ${book.author}`}
    >
      <figure>
        <div className="bg-muted relative aspect-3/4 overflow-hidden">
          <Image
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 639px) 45vw, (max-width: 767px) 30vw, (max-width: 1023px) 22vw, (max-width: 1279px) 18vw, 14vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <figcaption className="p-3">
          <h3 className="truncate text-sm font-semibold">{book.title}</h3>
          <p className="text-muted-foreground mt-1 truncate text-sm">
            {book.author}
          </p>
          <dl className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <MessageCircle className="size-3" aria-hidden="true" />
              <dt className="sr-only">Conversations</dt>
              <dd>{book.conversationCount}</dd>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="size-3" aria-hidden="true" />
              <dt className="sr-only">Pages</dt>
              <dd>{book.totalPages}</dd>
            </div>
          </dl>
        </figcaption>
      </figure>
    </Link>
  );
}
