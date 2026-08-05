export abstract class ConversationDomainError extends Error {
  public abstract readonly code: "CONVERSATION_NOT_FOUND" | "CONVERSATION_VALIDATION_ERROR";
}

export class ConversationNotFoundError extends ConversationDomainError {
  public readonly code = "CONVERSATION_NOT_FOUND";

  public constructor() {
    super("Conversation not found.");
    this.name = "ConversationNotFoundError";
  }
}

export class ConversationValidationError extends ConversationDomainError {
  public readonly code = "CONVERSATION_VALIDATION_ERROR";

  public constructor(message: string) {
    super(message);
    this.name = "ConversationValidationError";
  }
}
