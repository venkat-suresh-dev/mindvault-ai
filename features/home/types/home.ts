import type { LucideIcon } from "lucide-react";

export interface HomeStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverUrl: string;
  voicePersona?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  conversationCount: number;
  totalPages: number;
  totalSegments: number;
  lastOpenedAt?: string;
}
