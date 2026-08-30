export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export interface ServiceError {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
  cause?: unknown;
}

export type Result<T, E = ServiceError> =
  { ok: true; value: T } | { ok: false; error: E };

export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function failure(error: ServiceError): Result<never> {
  return { ok: false, error };
}
