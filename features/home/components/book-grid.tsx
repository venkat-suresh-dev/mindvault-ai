import type { Book } from "@/features/home/types/home";
import { BookCard } from "./book-card";

interface BookGridProps {
  books: Book[];
}

export function BookGrid({ books }: BookGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
