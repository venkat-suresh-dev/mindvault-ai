export interface ChatGenerationInput {
  prompt: string;
  signal?: AbortSignal;
  onAttempt?: (model: string) => Promise<void> | void;
}

export interface ChatProvider {
  stream(input: ChatGenerationInput): AsyncIterable<string>;
  generate(input: ChatGenerationInput): Promise<string>;
}
