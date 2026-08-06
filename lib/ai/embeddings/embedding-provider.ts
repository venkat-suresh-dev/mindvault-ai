import type { GeneratedEmbedding } from "./types";

export interface EmbeddingAttemptResult { attempt: number; durationMs: number; success: boolean; errorClassification?: string }
export type EmbeddingAttemptCallback = (result: EmbeddingAttemptResult) => Promise<void> | void;

export interface EmbeddingProvider {
  embedDocuments(texts: string[], signal?: AbortSignal, onAttempt?: EmbeddingAttemptCallback): Promise<GeneratedEmbedding[]>;
  embedQuery(text: string, signal?: AbortSignal): Promise<GeneratedEmbedding>;
}
