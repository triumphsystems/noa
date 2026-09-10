import { NextRequest } from 'next/server';
import {
  forgotPasswordWithCognito,
  getCognitoConfig,
} from '@/lib/auth/cognito';
import { enforceRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import { forgotPasswordSchema } from '@/lib/validations';
import { apiError, apiSuccess, zodValidationError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const parseResult = forgotPasswordSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(parseResult.error, 'Email address is required');
    }

    const { email } = parseResult.data;

    // 1. Rate limiting: max 5 requests per minute per client
    const clientId = getClientIdentifier(request, email);
    const rateLimitRes = await enforceRateLimit(`forgot-pwd:${clientId}`, {
      limit: 5,
      windowSeconds: 60,
    });
    if (rateLimitRes) return rateLimitRes;

    const trimmedEmail = email.trim().toLowerCase();
    const { isConfigured } = getCognitoConfig();

    if (isConfigured) {
      try {
        const result = await forgotPasswordWithCognito(trimmedEmail);
        return apiSuccess({
          message: 'Password reset code sent successfully',
          destination: result.destination,
        });
      } catch (err) {
        const errObj = err as Record<string, unknown> | undefined;
        const errMsg = err instanceof Error ? err.message : 'Failed to send reset code';
        console.error('[API] Forgot password error:', errMsg);
        // Prevent user enumeration: if user is not found, respond with generic success
        if (
          errMsg.includes('No account found') ||
          errObj?.name === 'UserNotFoundException'
        ) {
          return apiSuccess({
            message:
              'If an account exists with this email, a verification code has been sent.',
            destination: trimmedEmail,
          });
        }
        return apiError(API_ERROR_CODES.BAD_REQUEST, errMsg, 400);
      }
    }

    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      'Service is not available',
      503
    );
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('[API] Forgot password route error:', msg);
    return apiError(API_ERROR_CODES.INTERNAL_SERVER_ERROR, msg, 500);
  }
}
