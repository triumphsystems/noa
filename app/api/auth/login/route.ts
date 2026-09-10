import { NextRequest, NextResponse } from 'next/server';
import {
  signInWithCognito,
  getCognitoConfig,
  getCognitoUser,
} from '@/lib/auth/cognito';
import { setAuthCookies } from '@/lib/auth/cookies';
import { isValidRole, type Role } from '@/lib/auth/roles';
import { resolveUserProfile } from '@/lib/auth/profile';
import { enforceRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import { loginSchema } from '@/lib/validations';
import { apiError, zodValidationError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const parseResult = loginSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(
        parseResult.error,
        'Email and password are required'
      );
    }

    const { email, password, userType } = parseResult.data;

    // Rate limiting: max 5 login attempts per minute per client (uses validated email)
    const clientId = getClientIdentifier(request, email);
    const rateLimitRes = await enforceRateLimit(`login:${clientId}`, {
      limit: 5,
      windowSeconds: 60,
    });
    if (rateLimitRes) return rateLimitRes;

    const { isConfigured } = getCognitoConfig();

    // 2. AWS Cognito Authentication
    if (isConfigured) {
      const tokens = await signInWithCognito(email, password);
      const cognitoUser = await getCognitoUser(tokens.accessToken);

      const canonicalId = cognitoUser?.sub || `user-${Date.now()}`;
      const resolvedRole: Role =
        cognitoUser?.userType && isValidRole(cognitoUser.userType)
          ? cognitoUser.userType
          : isValidRole(userType)
            ? userType
            : 'doctor';

      const profile = await resolveUserProfile(canonicalId, resolvedRole);

      if (!profile) {
        return apiError(
          API_ERROR_CODES.UNAUTHORIZED,
          'User profile not found in database',
          401
        );
      }

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: profile,
      });

      // Set tamper-proof httpOnly secure session cookies
      return setAuthCookies(response, tokens, {
        sub: profile.id,
        email: profile.email,
        name: profile.name,
        userType: profile.userType,
      });
    }

    return apiError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      'Authentication service is currently unavailable.',
      503
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Login failed';
    console.error('[Auth] Login error:', msg);
    return apiError(API_ERROR_CODES.UNAUTHORIZED, msg, 401);
  }
}
