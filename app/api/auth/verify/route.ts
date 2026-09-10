import { NextRequest, NextResponse } from 'next/server';
import { confirmCognitoSignUp, getCognitoConfig } from '@/lib/auth/cognito';
import { enforceRateLimit, getClientIdentifier } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // 1. Rate limiting: max 5 attempts per minute per client
    const clientId = getClientIdentifier(request, email);
    const rateLimitRes = await enforceRateLimit(`verify:${clientId}`, {
      limit: 5,
      windowSeconds: 60,
    });
    if (rateLimitRes) return rateLimitRes;

    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    const { isConfigured } = getCognitoConfig();

    if (isConfigured) {
      await confirmCognitoSignUp(trimmedEmail, trimmedCode);
      return NextResponse.json({
        success: true,
        message: 'Account verified successfully. You can now log in.',
      });
    }

    return NextResponse.json(
      { message: 'Authentication service is not configured' },
      { status: 503 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Verification failed';
    console.error('[API] Verification error:', msg);
    return NextResponse.json({ message: msg }, { status: 400 });
  }
}
