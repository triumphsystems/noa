import { NextRequest, NextResponse } from 'next/server';
import {
  forgotPasswordWithCognito,
  getCognitoConfig,
} from '@/lib/auth/cognito';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // 1. Rate limiting: max 5 requests per minute per client
    const clientId = getClientIdentifier(request, email);
    const rateCheck = await checkRateLimit(`forgot-pwd:${clientId}`, {
      limit: 5,
      windowSeconds: 60,
    });
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { message: 'Email address is required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const { isConfigured } = getCognitoConfig();

    if (isConfigured) {
      try {
        const result = await forgotPasswordWithCognito(trimmedEmail);
        return NextResponse.json({
          success: true,
          message: 'Password reset code sent successfully',
          destination: result.destination,
        });
      } catch (err: any) {
        console.error('[API] Forgot password error:', err?.message);
        // Prevent user enumeration: if user is not found, respond with generic success
        if (
          err?.message?.includes('No account found') ||
          err?.name === 'UserNotFoundException'
        ) {
          return NextResponse.json({
            success: true,
            message:
              'If an account exists with this email, a verification code has been sent.',
            destination: trimmedEmail,
          });
        }
        return NextResponse.json(
          { message: err?.message || 'Failed to send reset code' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Authentication service is not configured' },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('[API] Forgot password route error:', error?.message);
    return NextResponse.json(
      { message: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
