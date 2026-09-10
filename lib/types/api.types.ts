/**
 * Canonical API Response & Error Types
 *
 * Single source of truth for all API responses across server route handlers
 * and client HTTP consumers.
 */

export const API_ERROR_CODES = {
  // Authentication & Authorization (401, 403)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCOUNT_UNVERIFIED: 'ACCOUNT_UNVERIFIED',

  // Request & Validation (400, 422)
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Resource State (404, 409)
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // Traffic & Capacity (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',

  // Safe Server Responses (500, 503) — Zero infrastructure leakage
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export interface ApiValidationErrorDetail {
  field?: string;
  issue: string;
}

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: ApiValidationErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Aliases for compatibility
export type ApiSuccess<T> = ApiSuccessResponse<T>;
export type ApiError = ApiErrorResponse;

/**
 * Server-side domain error class.
 * Thrown intentionally inside business logic or services.
 */
export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly details?: ApiValidationErrorDetail[];

  constructor(
    message: string,
    code: ApiErrorCode,
    statusCode: number = 400,
    details?: ApiValidationErrorDetail[]
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Client-side HTTP error class.
 * Thrown by lib/http.ts when an API response has !response.ok.
 */
export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: ApiValidationErrorDetail[];

  constructor(
    message: string,
    code: ApiErrorCode,
    status: number,
    details?: ApiValidationErrorDetail[]
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}
