import { NextRequest, NextResponse } from 'next/server'
import { confirmForgotPasswordWithCognito, revokeAllUserSessions, getCognitoConfig } from '@/lib/auth/cognito'
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, newPassword } = body

    // 1. Rate limiting: max 5 code attempts per minute per client to prevent brute-forcing
    const clientId = getClientIdentifier(request, email)
    const rateCheck = await checkRateLimit(`reset-pwd:${clientId}`, { limit: 5, windowSeconds: 60 })
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck)
    }

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { message: 'Email, verification code, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedCode = code.trim()
    const { isConfigured } = getCognitoConfig()

    if (isConfigured) {
      try {
        await confirmForgotPasswordWithCognito({
          email: trimmedEmail,
          code: trimmedCode,
          newPassword,
        })

        // Terminate all existing sessions on other devices after password change
        await revokeAllUserSessions(trimmedEmail)

        return NextResponse.json({
          success: true,
          message: 'Password has been reset successfully. You can now log in.',
        })
      } catch (err: any) {
        console.error('[API] Reset password error:', err?.message)
        return NextResponse.json(
          { message: err?.message || 'Failed to reset password' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Authentication service is not configured' },
      { status: 503 }
    )
  } catch (error: any) {
    console.error('[API] Reset password route error:', error?.message)
    return NextResponse.json(
      { message: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
