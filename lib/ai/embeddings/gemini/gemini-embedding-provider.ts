import "server-only";

import { GoogleGenAI } from "@google/genai";
import { aiConfig } from "@/lib/config/ai.config";
import { EmbeddingGenerationError } from "../embedding-errors";
import type { EmbeddingAttemptCallback, EmbeddingProvider } from "../embedding-provider";
import type { GeneratedEmbedding } from "../types";
import { log } from "@/lib/observability/logger";

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private readonly client = new GoogleGenAI({ apiKey: aiConfig.gemini.apiKey });

  public async embedDocuments(texts: string[], signal?: AbortSignal, onAttempt?: EmbeddingAttemptCallback): Promise<GeneratedEmbedding[]> {
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
              abortSignal: combineSignals(signal, abortController.signal),
            },
          });
        } finally {
          clearTimeout(timeout);
        }
      }, onAttempt);

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
      logDevelopmentProviderFailure(error);
      if (error instanceof EmbeddingGenerationError) throw error;
      throw new EmbeddingGenerationError("Unable to generate embeddings.", { cause: error });
    }
  }

  public async embedQuery(text: string, signal?: AbortSignal): Promise<GeneratedEmbedding> {
    try {
      const response = await this.client.models.embedContent({
        model: aiConfig.embeddings.model,
        contents: text,
        config: {
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: aiConfig.embeddings.dimensions,
          abortSignal: signal,
        },
      });
      const vector = response.embeddings?.[0]?.values;
      if (!vector || vector.length !== aiConfig.embeddings.dimensions) {
        throw new EmbeddingGenerationError("The embedding provider returned an invalid query vector.");
      }
      return { vector: normalizeVector(vector), model: aiConfig.embeddings.model, dimensions: aiConfig.embeddings.dimensions };
    } catch (error) {
      logDevelopmentProviderFailure(error);
      if (error instanceof EmbeddingGenerationError) throw error;
      throw new EmbeddingGenerationError("Unable to generate a question embedding.", { cause: error });
    }
  }

  private async withTransientRetry<T>(operation: () => Promise<T>, onAttempt?: EmbeddingAttemptCallback): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= aiConfig.embeddings.maxRetries; attempt += 1) {
      try {
        const startedAt = Date.now();
        const value = await operation();
        await onAttempt?.({ attempt, durationMs: Date.now() - startedAt, success: true });
        return value;
      } catch (error) {
        await onAttempt?.({ attempt, durationMs: 0, success: false, errorClassification: isTransientEmbeddingError(error) ? "TRANSIENT" : "PROVIDER" });
        lastError = error;
        if (!isTransientEmbeddingError(error) || attempt === aiConfig.embeddings.maxRetries) break;
        await delay(aiConfig.embeddings.retryBaseDelayMs * 2 ** (attempt - 1));
      }
    }
    throw lastError;
  }
}

function logDevelopmentProviderFailure(error: unknown): void {
  if (process.env.NODE_ENV !== "development") return;
  const code = error instanceof Error ? getErrorCode(error) : undefined;
  log("debug", "ai.embedding.provider.failure", {
    providerErrorMessage: error instanceof Error ? error.message : "Unknown provider error",
    providerErrorCode: code,
  });
}

function getErrorCode(error: Error): string | number | undefined {
  const code = Reflect.get(error, "code") ?? Reflect.get(error, "status") ?? Reflect.get(error, "statusCode");
  return typeof code === "string" || typeof code === "number" ? code : undefined;
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

function combineSignals(external: AbortSignal | undefined, timeout: AbortSignal): AbortSignal {
  if (!external) return timeout;
  const controller = new AbortController();
  const abort = () => controller.abort();
  external.addEventListener("abort", abort, { once: true });
  timeout.addEventListener("abort", abort, { once: true });
  if (external.aborted || timeout.aborted) controller.abort();
  return controller.signal;
}
