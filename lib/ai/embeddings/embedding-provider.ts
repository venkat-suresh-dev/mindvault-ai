import type { GeneratedEmbedding } from "./types";

export interface EmbeddingProvider {
  embedDocuments(texts: string[]): Promise<GeneratedEmbedding[]>;
}
