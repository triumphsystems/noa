import { NextRequest, NextResponse } from 'next/server';
import {
  refreshCognitoTokens,
  getCognitoUser,
  getCognitoConfig,
} from '@/lib/auth/cognito';
import {
  AUTH_COOKIE_NAMES,
  setAuthCookies,
  clearAuthCookies,
} from '@/lib/auth/cookies';
import { isValidRole, type Role } from '@/lib/auth/roles';
import { resolveUserProfile } from '@/lib/auth/profile';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(
      AUTH_COOKIE_NAMES.REFRESH_TOKEN
    )?.value;

    if (!refreshToken) {
      const response = NextResponse.json(
        { message: 'No refresh token present' },
        { status: 401 }
      );
      return clearAuthCookies(response);
    }

    const { isConfigured } = getCognitoConfig();
    if (!isConfigured) {
      return NextResponse.json(
        { message: 'Authentication service is not available' },
        { status: 503 }
      );
    }

    // Exchange refresh token with AWS Cognito for fresh access and ID tokens
    const tokens = await refreshCognitoTokens(refreshToken);
    const cognitoUser = await getCognitoUser(tokens.accessToken);

    const userId = cognitoUser?.sub;
    const userRole: Role =
      cognitoUser?.userType && isValidRole(cognitoUser.userType)
        ? cognitoUser.userType

    const profile = await resolveUserProfile(userId, userRole, {
      email: cognitoUser?.email || '',
      name: cognitoUser?.name || 'User',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Tokens refreshed successfully',
      user: profile,
    });

    return setAuthCookies(response, tokens, {
      sub: profile.id,
      email: profile.email,
      name: profile.name,
      userType: profile.userType,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to refresh authentication session';
    console.error('[Auth] Token refresh error:', msg);
    const response = NextResponse.json(
      { message: msg },
      { status: 401 }
    );
    return clearAuthCookies(response);
  }
}
