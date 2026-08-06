"use client";

import { Button } from "@/components/ui/button";
import { deleteBook } from "@/features/books/actions/delete-book";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function BookDeleteButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Delete this book, its segments, PDF, and cover image? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteBook(bookId);
      if (!result.success) return setError(result.message);
      router.push("/");
      router.refresh();
    });
  };

  return <div className="space-y-2"><Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>{isPending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}Delete book</Button>{error && <p role="alert" className="text-destructive text-xs">{error}</p>}</div>;
}
