export interface ChatGenerationInput {
  prompt: string;
}

export interface ChatProvider {
  stream(input: ChatGenerationInput): AsyncIterable<string>;
}
