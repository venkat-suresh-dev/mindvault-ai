export abstract class BookDomainError extends Error {
  public abstract readonly code:
    | "DUPLICATE_BOOK"
    | "BOOK_NOT_FOUND"
    | "UNAUTHORIZED_BOOK_ACCESS"
    | "VALIDATION_ERROR"
    | "DUPLICATE_SEGMENTS"
    | "PDF_PROCESSING_ERROR"
    | "STORAGE_ERROR";
}

export class DuplicateBookError extends BookDomainError {
  public readonly code = "DUPLICATE_BOOK";

  public constructor() {
    super("You already have a book with this title in your library.");
    this.name = "DuplicateBookError";
  }
}

export class BookNotFoundError extends BookDomainError {
  public readonly code = "BOOK_NOT_FOUND";

  public constructor() {
    super("Book not found.");
    this.name = "BookNotFoundError";
  }
}

export class UnauthorizedBookAccessError extends BookDomainError {
  public readonly code = "UNAUTHORIZED_BOOK_ACCESS";

  public constructor(message = "You do not have access to this book.") {
    super(message);
    this.name = "UnauthorizedBookAccessError";
  }
}

export class BookValidationError extends BookDomainError {
  public readonly code = "VALIDATION_ERROR";

  public constructor(message = "Provide valid book metadata.") {
    super(message);
    this.name = "BookValidationError";
  }
}

export class DuplicateBookSegmentsError extends BookDomainError {
  public readonly code = "DUPLICATE_SEGMENTS";

  public constructor() {
    super("One or more segment indexes already exist for this book.");
    this.name = "DuplicateBookSegmentsError";
  }
}

export class PdfProcessingError extends BookDomainError {
  public readonly code = "PDF_PROCESSING_ERROR";

  public constructor(message = "The PDF could not be processed.", options?: ErrorOptions) {
    super(message, options);
    this.name = "PdfProcessingError";
  }
}

export class BookStorageError extends BookDomainError {
  public readonly code = "STORAGE_ERROR";

  public constructor(message = "The uploaded file could not be stored.", options?: ErrorOptions) {
    super(message, options);
    this.name = "BookStorageError";
  }
}

export function isBookDomainError(error: unknown): error is BookDomainError {
  return error instanceof BookDomainError;
}
