export type EmbeddingModel = "gemini-embedding-001";

export interface GeneratedEmbedding {
  vector: number[];
  model: EmbeddingModel;
  dimensions: number;
}
