import type { Citation } from "@/features/search/types/search";

export interface ChatRequest {
  question: string;
}

export interface ChatStreamEvent {
  type: "text" | "citations" | "error";
  text?: string;
  citations?: Citation[];
}

export type { Citation };
