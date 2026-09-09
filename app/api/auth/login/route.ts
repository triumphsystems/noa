import { NextRequest, NextResponse } from 'next/server';
import {
  signInWithCognito,
  getCognitoConfig,
  getCognitoUser,
} from '@/lib/auth/cognito';
import { setAuthCookies } from '@/lib/auth/cookies';
import { isValidRole, type Role } from '@/lib/auth/roles';
import { resolveUserProfile } from '@/lib/auth/profile';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, userType } = body;

    // Validate input FIRST before rate limiting, so we don't use 'undefined' as the rate-limit key
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Rate limiting: max 5 login attempts per minute per client (uses validated email)
    const clientId = getClientIdentifier(request, email);
    const rateCheck = await checkRateLimit(`login:${clientId}`, {
      limit: 5,
      windowSeconds: 60,
    });
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

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

      const profile = await resolveUserProfile(canonicalId, resolvedRole, {
        email: email.trim().toLowerCase(),
        name: cognitoUser?.name || email,
      });

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

    return NextResponse.json(
      {
        message: 'Authentication service is currently unavailable.',
      },
      { status: 503 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Login failed';
    console.error('[Auth] Login error:', msg);
    return NextResponse.json(
      { message: msg },
      { status: 401 }
    );
  }
}
