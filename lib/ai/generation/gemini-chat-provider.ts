import "server-only";

import { GoogleGenAI } from "@google/genai";
import { aiConfig, assertGenerationConfiguration } from "@/lib/config/ai.config";
import type { ChatGenerationInput, ChatProvider } from "./types";
import { GenerationUnavailableError } from "./generation-errors";

export class GeminiChatProvider implements ChatProvider {
  private readonly client: GoogleGenAI;

  public constructor() {
    assertGenerationConfiguration();
    this.client = new GoogleGenAI({ apiKey: aiConfig.gemini.apiKey });
  }

  public async *stream(input: ChatGenerationInput): AsyncIterable<string> {
    const response = await this.withModelFallback((model) => this.client.models.generateContentStream({ model, contents: input.prompt }));
    for await (const chunk of response) {
      if (chunk.text) yield chunk.text;
    }
  }

  public async generate(input: ChatGenerationInput): Promise<string> {
    const response = await this.withModelFallback((model) => this.client.models.generateContent({ model, contents: input.prompt }));
    return response.text ?? "";
  }

  private async withModelFallback<T>(request: (model: string) => Promise<T>): Promise<T> {
    const primaryModel: string = aiConfig.generation.primaryModel;
    const fallbackModel: string = aiConfig.generation.fallbackModel;
    try {
      return await this.withRetries(primaryModel, request);
    } catch (primaryError) {
      if (fallbackModel === primaryModel) throw new GenerationUnavailableError({ cause: primaryError });
      try {
        return await this.withRetries(fallbackModel, request);
      } catch (fallbackError) {
        throw new GenerationUnavailableError({ cause: fallbackError });
      }
    }
  }

  private async withRetries<T>(model: string, request: (model: string) => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= aiConfig.generation.maxRetries; attempt += 1) {
      try {
        return await withTimeout(request(model), aiConfig.generation.requestTimeoutMs);
      } catch (error) {
        lastError = error;
        if (!isRetryableGenerationError(error) || attempt === aiConfig.generation.maxRetries) break;
        const delayMs = Math.min(aiConfig.generation.retryBaseDelayMs * 2 ** attempt, aiConfig.generation.retryMaxDelayMs);
        console.warn("Retrying Gemini generation after a transient provider failure.", { model, attempt: attempt + 1, delayMs });
        await sleep(delayMs);
      }
    }
    throw lastError;
  }
}

function isRetryableGenerationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const providerError = error as Error & { code?: unknown; status?: unknown };
  const code = typeof providerError.code === "number" ? providerError.code : undefined;
  const status = typeof providerError.status === "string" ? providerError.status : "";
  return code === 429 || code === 500 || code === 502 || code === 503 || code === 504 || status === "UNAVAILABLE" || status === "RESOURCE_EXHAUSTED" || /network|timeout|temporar|unavailable|overload/i.test(error.message);
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Gemini generation request timed out.")), timeoutMs);
    operation.then((value) => { clearTimeout(timer); resolve(value); }, (error: unknown) => { clearTimeout(timer); reject(error); });
  });
}
