import { NextRequest, NextResponse } from 'next/server'
import { forgotPasswordWithCognito, getCognitoConfig } from '@/lib/auth/cognito'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { message: 'Email address is required' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()
    const { isConfigured } = getCognitoConfig()

    if (isConfigured) {
      try {
        const result = await forgotPasswordWithCognito(trimmedEmail)
        return NextResponse.json({
          success: true,
          message: 'Password reset code sent successfully',
          destination: result.destination,
        })
      } catch (err: any) {
        // For security reasons, if user is not found, we can still return standard response or message
        console.error('[API] Forgot password error:', err?.message)
        return NextResponse.json(
          { message: err?.message || 'Failed to send reset code' },
          { status: 400 }
        )
      }
    }

    // Dev/Local fallback if Cognito is not configured
    if (process.env.ALLOW_DEV_AUTH === 'true' || process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        success: true,
        message: 'Dev mode: Reset code simulated (use 123456)',
        destination: trimmedEmail,
      })
    }

    return NextResponse.json(
      { message: 'Authentication service is not configured' },
      { status: 503 }
    )
  } catch (error: any) {
    console.error('[API] Forgot password route error:', error?.message)
    return NextResponse.json(
      { message: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
