import { NextRequest, NextResponse } from 'next/server'
import { confirmCognitoSignUp, getCognitoConfig } from '@/lib/auth/cognito'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedCode = code.trim()
    const { isConfigured } = getCognitoConfig()

    if (isConfigured) {
      await confirmCognitoSignUp(trimmedEmail, trimmedCode)
      return NextResponse.json({
        success: true,
        message: 'Account verified successfully. You can now log in.',
      })
    }

    // Dev mode fallback
    if (process.env.ALLOW_DEV_AUTH === 'true' || process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        success: true,
        message: 'Dev mode: Account verified successfully.',
      })
    }

    return NextResponse.json(
      { message: 'Authentication service is not configured' },
      { status: 503 }
    )
  } catch (error: any) {
    console.error('[API] Verification error:', error?.message)
    return NextResponse.json(
      { message: error?.message || 'Verification failed' },
      { status: 400 }
    )
  }
}
