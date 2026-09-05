import { NextRequest, NextResponse } from 'next/server';
import { signOutWithCognito } from '@/lib/auth/cognito';
import { clearAuthCookies, AUTH_COOKIE_NAMES } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(
      AUTH_COOKIE_NAMES.ACCESS_TOKEN
    )?.value;

    if (accessToken) {
      await signOutWithCognito(accessToken);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    return clearAuthCookies(response);
  } catch (error: any) {
    console.error('[Auth] Logout error:', error?.message);
    const response = NextResponse.json({
      success: true,
      message: 'Local session cleared',
    });
    return clearAuthCookies(response);
  }
}
