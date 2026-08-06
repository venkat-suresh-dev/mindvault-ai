export class ProviderCallBudgetExceededError extends Error {
  public constructor() {
    super("Generation provider-call budget exceeded.");
    this.name = "ProviderCallBudgetExceededError";
  }
}
