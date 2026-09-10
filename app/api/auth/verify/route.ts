import { NextRequest } from 'next/server';
import { confirmCognitoSignUp, getCognitoConfig } from '@/lib/auth/cognito';
import { enforceRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import { verifyCodeSchema } from '@/lib/validations';
import { apiError, apiSuccess, zodValidationError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const parseResult = verifyCodeSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(
        parseResult.error,
        'Email and verification code are required'
      );
    }

    const { email, code } = parseResult.data;

    // 1. Rate limiting: max 5 attempts per minute per client
    const clientId = getClientIdentifier(request, email);
    const rateLimitRes = await enforceRateLimit(`verify:${clientId}`, {
      limit: 5,
      windowSeconds: 60,
    });
    if (rateLimitRes) return rateLimitRes;

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    const { isConfigured } = getCognitoConfig();

    if (isConfigured) {
      await confirmCognitoSignUp(trimmedEmail, trimmedCode);
      return apiSuccess({
        message: 'Account verified successfully. You can now log in.',
      });
    }

    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      'Authentication service is not configured',
      503
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Verification failed';
    console.error('[API] Verification error:', msg);
    return apiError(API_ERROR_CODES.BAD_REQUEST, msg, 400);
  }
}
