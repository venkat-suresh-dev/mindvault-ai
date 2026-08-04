import type { EmbeddingModel } from "@/lib/ai/embeddings/types";

const GEMINI_EMBEDDING_MODEL: EmbeddingModel = "gemini-embedding-001";

function getRequiredEnvironmentVariable(name: "GOOGLE_GEMINI_API_KEY"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured before generating embeddings.`);
  return value;
}

export const aiConfig = {
  gemini: {
    get apiKey(): string {
      return getRequiredEnvironmentVariable("GOOGLE_GEMINI_API_KEY");
    },
  },
  embeddings: {
    model: GEMINI_EMBEDDING_MODEL,
    dimensions: 768,
    batchSize: 50,
    maxRetries: 3,
    retryBaseDelayMs: 500,
    timeoutMs: 30_000,
  },
} as const;
