import "server-only";

import { GoogleGenAI } from "@google/genai";
import { aiConfig } from "@/lib/config/ai.config";
import type { ChatGenerationInput, ChatProvider } from "./types";

export class GeminiChatProvider implements ChatProvider {
  private readonly client = new GoogleGenAI({ apiKey: aiConfig.gemini.apiKey });

  public async *stream(input: ChatGenerationInput): AsyncIterable<string> {
    const response = await this.client.models.generateContentStream({ model: aiConfig.generation.model, contents: input.prompt });
    for await (const chunk of response) {
      if (chunk.text) yield chunk.text;
    }
  }

  public async generate(input: ChatGenerationInput): Promise<string> {
    const response = await this.client.models.generateContent({ model: aiConfig.generation.model, contents: input.prompt });
    return response.text ?? "";
  }
}
