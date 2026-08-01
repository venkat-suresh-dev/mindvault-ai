import { SAMPLE_BOOKS } from "@/features/home/constants/sample-books";
import { HOME_CONTENT } from "@/features/home/constants/home-content";
import { BookGrid } from "./book-grid";
import { EmptyLibrary } from "./empty-library";

export function LibrarySection() {
  const { library } = HOME_CONTENT;
  const books = SAMPLE_BOOKS;

  return (
    <section id="library" aria-labelledby="library-heading" className="border-border border-t px-4 py-12 sm:px-6 lg:py-16">
      <div className="container mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-primary text-sm font-semibold">{library.eyebrow}</p>
          <h2 id="library-heading" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {library.title}
          </h2>
          <p className="text-muted-foreground mt-3 leading-7">{library.description}</p>
        </div>

        <div className="mt-8">
          {books.length > 0 ? <BookGrid books={books} /> : <EmptyLibrary />}
        </div>
      </div>
    </section>
  );
}
