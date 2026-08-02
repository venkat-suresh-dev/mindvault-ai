import { MongoServerError } from "mongodb";

export type DatabaseErrorCode =
  | "CONFLICT"
  | "CONNECTION_FAILED"
  | "DATABASE_ERROR"
  | "INVALID_ID";

export class DatabaseError extends Error {
  public readonly code: DatabaseErrorCode;

  public constructor(code: DatabaseErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DatabaseError";
    this.code = code;
  }
}

export function toDatabaseError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) return error;

  if (error instanceof MongoServerError && error.code === 11000) {
    return new DatabaseError("CONFLICT", "A record with these unique values already exists.", {
      cause: error,
    });
  }

  return new DatabaseError("DATABASE_ERROR", "The database request could not be completed.", {
    cause: error,
  });
}
