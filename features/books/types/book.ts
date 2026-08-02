import type { VoicePersonaId } from "@/features/books/constants/voice-personas";

export interface BookInput {
  title: string;
  author: string;
  pdfFile: File;
  coverImage?: File;
  voicePersona: VoicePersonaId;
}

export interface Book {
  id: string;
  ownerId: string;
  title: string;
  author: string;
  slug: string;
  coverUrl?: string;
  fileUrl: string;
  voicePersona: VoicePersonaId;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookResult {
  status: "created" | "unauthenticated" | "validation-error" | "not-configured";
  message: string;
}
