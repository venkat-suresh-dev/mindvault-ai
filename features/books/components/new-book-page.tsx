import { BOOK_PAGE_CONTENT } from "@/features/books/constants/book-upload";
import { BookOpen, Check } from "lucide-react";
import { BookUploadForm } from "./book-upload-form";

export function NewBookPage() {
  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      <div className="container mx-auto max-w-3xl">
        <header className="max-w-2xl">
          <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
            <BookOpen className="size-5" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{BOOK_PAGE_CONTENT.title}</h1>
          <p className="text-muted-foreground mt-3 text-base leading-7 sm:text-lg">{BOOK_PAGE_CONTENT.description}</p>
        </header>

        <div className="mt-8">
          <BookUploadForm />
        </div>

        <section aria-labelledby="upload-next-heading" className="border-border bg-muted/40 mt-8 rounded-2xl border p-5 sm:p-6">
          <h2 id="upload-next-heading" className="text-lg font-semibold">{BOOK_PAGE_CONTENT.help.title}</h2>
          <ul className="mt-4 space-y-3">
            {BOOK_PAGE_CONTENT.help.items.map((item) => (
              <li key={item} className="text-muted-foreground flex gap-3 text-sm leading-6">
                <Check className="text-primary mt-1 size-4 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
