import type { ChatProvider } from "./chat-provider";
import { GeminiChatProvider } from "./gemini-chat-provider";

export type { ChatGenerationInput, ChatProvider } from "./types";

export function createChatProvider(): ChatProvider {
  return new GeminiChatProvider();
}
