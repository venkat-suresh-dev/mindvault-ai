export class GenerationUnavailableError extends Error {
  public constructor(options?: ErrorOptions) {
    super("Generation temporarily unavailable.", options);
    this.name = "GenerationUnavailableError";
  }
}
