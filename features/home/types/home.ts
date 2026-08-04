import type { LucideIcon } from "lucide-react";
import type { BookRecord } from "@/features/books/types/book";

export interface HomeStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export type LibraryBook = BookRecord;
