export class EmbeddingGenerationError extends Error {
  public constructor(message = "Unable to generate embeddings.", options?: ErrorOptions) {
    super(message, options);
    this.name = "EmbeddingGenerationError";
  }
}
