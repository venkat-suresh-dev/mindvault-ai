import { Button } from "@/components/ui/button";
import { CheckCircle2, LibraryBig, Upload } from "lucide-react";
import Link from "next/link";

interface UploadSuccessStateProps {
  bookTitle: string;
  onUploadAnother: () => void;
}

const COMPLETION_STEPS = ["Upload completed", "Text extracted", "AI embeddings generated"];

export function UploadSuccessState({ bookTitle, onUploadAnother }: UploadSuccessStateProps) {
  return (
    <section className="border-border bg-card rounded-2xl border p-6 shadow-sm sm:p-8" aria-labelledby="upload-complete-heading">
      <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
        <CheckCircle2 className="size-6" aria-hidden="true" />
      </div>
      <p className="text-primary mt-5 text-sm font-semibold">Your book is ready</p>
      <h2 id="upload-complete-heading" className="mt-1 text-2xl font-bold tracking-tight">{bookTitle}</h2>
      <p className="text-muted-foreground mt-3 max-w-lg leading-7">
        MindVault has prepared this book for grounded AI conversations.
      </p>

      <ul className="mt-7 space-y-3" aria-label="Completed processing steps">
        {COMPLETION_STEPS.map((step) => (
          <li key={step} className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="text-primary size-4" aria-hidden="true" />
            {step}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
        <Button asChild>
          <Link href="/#library"><LibraryBig aria-hidden="true" />View Library</Link>
        </Button>
        <Button type="button" variant="outline" onClick={onUploadAnother}>
          <Upload aria-hidden="true" />Upload Another Book
        </Button>
      </div>
    </section>
  );
}
