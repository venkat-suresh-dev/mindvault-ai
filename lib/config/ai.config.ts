import type { EmbeddingModel } from "@/lib/ai/embeddings/types";

const GEMINI_EMBEDDING_MODEL: EmbeddingModel = "gemini-embedding-001";
const GENERATION_MODEL_NAME_PATTERN = /^gemini-[a-z0-9.-]+$/;

function getRequiredEnvironmentVariable(name: "GOOGLE_GEMINI_API_KEY"): string {
  const value = process.env[name]?.trim();
  if (!value)
    throw new Error(`${name} must be configured before generating embeddings.`);
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
  generation: {
    primaryModel: "gemini-3.5-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxRetries: 3,
    retryBaseDelayMs: 500,
    retryMaxDelayMs: 4_000,
    requestTimeoutMs: 30_000,
  },
  knowledge: {
    batchSegmentCount: 4,
    maxBatchContextTokens: 4_000,
    maxIntermediateTokens: 12_000,
    flashcardCount: 12,
    quizQuestionCount: 10,
    maxMindMapDepth: 4,
    generationTimeoutMs: 600_000,
    staleGenerationTimeoutMs: 660_000,
  },
  retrieval: {
    vectorIndexName: "book_segments_vector_index",
    topK: 12,
    numCandidates: 100,
    minimumScore: 0.55,
    maxContextSegments: 6,
    reranking: {
      enabled: false,
    },
  },
  conversations: {
    recentMessageCount: 8,
    summaryTriggerMessageCount: 12,
    maxSummaryTokens: 1_000,
    maxRecentMessageTokens: 1_600,
    maxRetrievedContextTokens: 4_000,
  },
} as const;

export function assertGenerationConfiguration(): void {
  const primaryModel: string = aiConfig.generation.primaryModel;
  const fallbackModel: string = aiConfig.generation.fallbackModel;
  if (
    !GENERATION_MODEL_NAME_PATTERN.test(primaryModel) ||
    !GENERATION_MODEL_NAME_PATTERN.test(fallbackModel)
  ) {
    throw new Error(
      "Generation model configuration must use valid Gemini model identifiers.",
    );
  }
  if (primaryModel === fallbackModel)
    throw new Error(
      "Generation primary and fallback models must be different.",
    );
}
