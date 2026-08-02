"use server";

import { bookFormSchema } from "@/features/books/schemas/book-schema";
import type { CreateBookResult } from "@/features/books/types/book";
import { auth } from "@clerk/nextjs/server";

export async function createBook(formData: FormData): Promise<CreateBookResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      status: "unauthenticated",
      message: "Sign in to add books to your personal AI library.",
    };
  }

  const input = {
    title: formData.get("title"),
    author: formData.get("author"),
    pdfFile: formData.get("pdfFile"),
    coverImage: formData.get("coverImage") || undefined,
    voicePersona: formData.get("voicePersona"),
  };

  const validation = bookFormSchema.safeParse(input);

  if (!validation.success) {
    return {
      status: "validation-error",
      message: "Review the book details and try again.",
    };
  }

  return {
    status: "not-configured",
    message:
      "Your book details are ready. Secure storage and AI processing will be connected next.",
  };
}
