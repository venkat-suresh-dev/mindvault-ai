export type ActionErrorCode =
  | "UNAUTHENTICATED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_BOOK"
  | "DUPLICATE_SEGMENTS"
  | "PDF_PROCESSING_ERROR"
  | "EMBEDDING_GENERATION_ERROR"
  | "STORAGE_ERROR"
  | "UNAUTHORIZED"
  | "DATABASE_ERROR";

export type ActionResult<T> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errorCode: ActionErrorCode };

export function actionFailure(errorCode: ActionErrorCode, message: string): ActionResult<never> {
  return { success: false, errorCode, message };
}
