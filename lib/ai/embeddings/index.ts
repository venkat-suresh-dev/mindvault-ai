import type { EmbeddingProvider } from "./embedding-provider";
import { GeminiEmbeddingProvider } from "./gemini/gemini-embedding-provider";

export { EmbeddingGenerationError } from "./embedding-errors";
export type { EmbeddingProvider } from "./embedding-provider";
export type { EmbeddingModel, GeneratedEmbedding } from "./types";

export function createEmbeddingProvider(): EmbeddingProvider {
  return new GeminiEmbeddingProvider();
}
