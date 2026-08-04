import "server-only";

import { GoogleGenAI } from "@google/genai";
import { aiConfig } from "@/lib/config/ai.config";
import { EmbeddingGenerationError } from "../embedding-errors";
import type { EmbeddingProvider } from "../embedding-provider";
import type { GeneratedEmbedding } from "../types";

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private readonly client = new GoogleGenAI({ apiKey: aiConfig.gemini.apiKey });

  public async embedDocuments(texts: string[]): Promise<GeneratedEmbedding[]> {
    if (texts.length === 0) return [];

    try {
      const response = await this.withTransientRetry(async () => {
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), aiConfig.embeddings.timeoutMs);
        try {
          return await this.client.models.embedContent({
            model: aiConfig.embeddings.model,
            contents: texts,
            config: {
              taskType: "RETRIEVAL_DOCUMENT",
              outputDimensionality: aiConfig.embeddings.dimensions,
              abortSignal: abortController.signal,
            },
          });
        } finally {
          clearTimeout(timeout);
        }
      });

      const embeddings = response.embeddings ?? [];
      if (embeddings.length !== texts.length) {
        throw new EmbeddingGenerationError("The embedding provider returned an incomplete result.");
      }

      return embeddings.map((embedding) => {
        const vector = embedding.values;
        if (!vector || vector.length !== aiConfig.embeddings.dimensions) {
          throw new EmbeddingGenerationError("The embedding provider returned an invalid vector.");
        }
        return { vector: normalizeVector(vector), model: aiConfig.embeddings.model, dimensions: aiConfig.embeddings.dimensions };
      });
    } catch (error) {
      if (error instanceof EmbeddingGenerationError) throw error;
      throw new EmbeddingGenerationError("Unable to generate embeddings.", { cause: error });
    }
  }

  public async embedQuery(text: string): Promise<GeneratedEmbedding> {
    try {
      const response = await this.client.models.embedContent({
        model: aiConfig.embeddings.model,
        contents: text,
        config: {
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: aiConfig.embeddings.dimensions,
        },
      });
      const vector = response.embeddings?.[0]?.values;
      if (!vector || vector.length !== aiConfig.embeddings.dimensions) {
        throw new EmbeddingGenerationError("The embedding provider returned an invalid query vector.");
      }
      return { vector: normalizeVector(vector), model: aiConfig.embeddings.model, dimensions: aiConfig.embeddings.dimensions };
    } catch (error) {
      if (error instanceof EmbeddingGenerationError) throw error;
      throw new EmbeddingGenerationError("Unable to generate a question embedding.", { cause: error });
    }
  }

  private async withTransientRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= aiConfig.embeddings.maxRetries; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (!isTransientEmbeddingError(error) || attempt === aiConfig.embeddings.maxRetries) break;
        await delay(aiConfig.embeddings.retryBaseDelayMs * 2 ** (attempt - 1));
      }
    }
    throw lastError;
  }
}

function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
  if (!Number.isFinite(magnitude) || magnitude === 0) throw new EmbeddingGenerationError("The embedding provider returned a zero-length vector.");
  return vector.map((value) => value / magnitude);
}

function isTransientEmbeddingError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (!(error instanceof Error)) return false;
  const status = getNumericProperty(error, "status") ?? getNumericProperty(error, "statusCode");
  if (status === 429 || status === 503 || status === 408) return true;
  if (status !== undefined) return false;
  return /timeout|timed out|network|fetch failed|econnreset|eai_again/i.test(error.message);
}

function getNumericProperty(value: object, key: string): number | undefined {
  const property = Reflect.get(value, key);
  return typeof property === "number" ? property : undefined;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
