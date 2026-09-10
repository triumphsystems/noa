import { NextRequest } from 'next/server';
import {
  confirmForgotPasswordWithCognito,
  revokeAllUserSessions,
  getCognitoConfig,
} from '@/lib/auth/cognito';
import { enforceRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import { apiError, apiSuccess } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    // 1. Rate limiting: max 5 code attempts per minute per client to prevent brute-forcing
    const clientId = getClientIdentifier(request, email);
    const rateLimitRes = await enforceRateLimit(`reset-pwd:${clientId}`, {
      limit: 5,
      windowSeconds: 60,
    });
    if (rateLimitRes) return rateLimitRes;

    if (!email || !code || !newPassword) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'Email, verification code, and new password are required',
        400
      );
    }

    if (newPassword.length < 6) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'Password must be at least 6 characters long',
        400
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    const { isConfigured } = getCognitoConfig();

    if (isConfigured) {
      try {
        await confirmForgotPasswordWithCognito({
          email: trimmedEmail,
          code: trimmedCode,
          newPassword,
        });

        // Terminate all existing sessions on other devices after password change
        await revokeAllUserSessions(trimmedEmail);

        return apiSuccess({
          message: 'Password has been reset successfully. You can now log in.',
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Failed to reset password';
        console.error('[API] Reset password error:', msg);
        return apiError(API_ERROR_CODES.BAD_REQUEST, msg, 400);
      }
    }

    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      'Authentication service is not configured',
      503
    );
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('[API] Reset password route error:', msg);
    return apiError(API_ERROR_CODES.INTERNAL_SERVER_ERROR, msg, 500);
  }
}
