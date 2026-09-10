import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  API_ERROR_CODES,
  type ApiErrorCode,
  type ApiErrorResponse,
  type ApiSuccessResponse,
  type ApiValidationErrorDetail,
  AppError,
} from '@/lib/types/api.types';

/**
 * Type guard for checking if an error is a domain AppError
 */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/**
 * Type guard to identify throttling/capacity exceptions (e.g. AWS Bedrock)
 * without leaking cloud provider specifics to the client.
 */
export function isThrottlingError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const candidate = err as Record<string, unknown>;
    const errorName = typeof candidate.name === 'string' ? candidate.name : '';
    const metadata = candidate.$metadata as Record<string, unknown> | undefined;
    const httpStatusCode = metadata?.httpStatusCode;

    return (
      errorName === 'ThrottlingException' ||
      errorName === 'RequestLimitExceeded' ||
      httpStatusCode === 429
    );
  }
  return false;
}

/**
 * Standard REST success response helper
 */
export function apiSuccess<T>(
  data: T,
  status: number = 200,
  init?: Omit<ResponseInit, 'status'>
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      ...init,
      status,
    }
  );
}

/**
 * Explicit error response constructor for route handlers and guards
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  options?: {
    details?: ApiValidationErrorDetail[];
    headers?: HeadersInit;
  }
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(options?.details && options.details.length > 0
          ? { details: options.details }
          : {}),
      },
    },
    {
      status,
      headers: options?.headers,
    }
  );
}

/**
 * Maps a ZodError to our canonical ApiValidationErrorDetail array
 */
export function formatZodError(error: ZodError): ApiValidationErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : undefined,
    issue: issue.message,
  }));
}

/**
 * Returns a canonical 400 VALIDATION_ERROR response from a ZodError
 */
export function zodValidationError(
  error: ZodError,
  message: string = 'Validation failed'
): NextResponse<ApiErrorResponse> {
  const details = formatZodError(error);
  return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400, { details });
}

/**
 * Universal error handler for catch blocks.
 * Guarantees zero leakage of internal server state, database errors, or SDK stack traces.
 */
export function handleApiError(
  error: unknown,
  fallbackMessage: string = 'An unexpected error occurred'
): NextResponse<ApiErrorResponse> {
  // Always log raw error with full stack trace server-side for CloudWatch
  console.error('[API Error]:', error);

  // 1. Zod validation failure
  if (error instanceof ZodError) {
    return zodValidationError(error);
  }

  // 2. Intentional domain error (safe to return domain message & validation details)
  if (isAppError(error)) {
    return apiError(error.code, error.message, error.statusCode, {
      details: error.details,
    });
  }

  // 3. Throttling or capacity exceeded
  if (isThrottlingError(error)) {
    return apiError(
      API_ERROR_CODES.CAPACITY_EXCEEDED,
      'Service capacity is temporarily constrained. Please retry in a few moments.',
      429,
      { headers: { 'Retry-After': '5' } }
    );
  }

  // 4. Opaque server error - strictly sanitized
  return apiError(
    API_ERROR_CODES.INTERNAL_SERVER_ERROR,
    fallbackMessage,
    500
  );
}
