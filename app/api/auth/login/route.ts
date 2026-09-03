import { NextRequest, NextResponse } from 'next/server'
import { getDoctorByEmail } from '@/lib/db'
import { signInWithCognito, getCognitoConfig, getCognitoUser } from '@/lib/auth/cognito'
import { setAuthCookies } from '@/lib/auth/cookies'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, userType } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { isConfigured } = getCognitoConfig()

    // 1. AWS Cognito Authentication
    if (isConfigured) {
      const tokens = await signInWithCognito(email, password)
      const cognitoUser = await getCognitoUser(tokens.accessToken)

      let resolvedUser = {
        id: cognitoUser?.sub || `user-${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: cognitoUser?.name || email,
        userType: (cognitoUser?.userType || userType || 'doctor') as 'doctor' | 'patient',
      }

      // If doctor, cross-reference DynamoDB profile
      if (resolvedUser.userType === 'doctor') {
        const doctor = await getDoctorByEmail(email)
        if (doctor) {
          resolvedUser.id = doctor.id
          resolvedUser.name = doctor.name
        }
      }

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: resolvedUser,
      })

      // Set tamper-proof httpOnly secure session cookies
      return setAuthCookies(response, tokens, {
        sub: resolvedUser.id,
        email: resolvedUser.email,
        name: resolvedUser.name,
        userType: resolvedUser.userType,
      })
    }

    // 2. Unconfigured Cognito Guard (Fail-fast transparency)
    // In healthcare, we never silently bypass passwords unless explicitly configured for local test mode
    if (process.env.ALLOW_DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
      const doctor = await getDoctorByEmail(email)
      if (!doctor) {
        return NextResponse.json({ message: 'Doctor account not found' }, { status: 401 })
      }

      const devUser = {
        sub: doctor.id,
        email: doctor.email,
        name: doctor.name,
        userType: 'doctor' as const,
      }

      const devTokens = {
        accessToken: `dev-token-${doctor.id}`,
        idToken: `dev-id-${doctor.id}`,
        expiresIn: 3600,
      }

      const response = NextResponse.json({
        success: true,
        message: 'Logged in via development auth bypass',
        user: devUser,
      })

      return setAuthCookies(response, devTokens, devUser)
    }

    return NextResponse.json(
      {
        message: 'AWS Cognito User Pool is not configured. Please provision Cognito via Terraform or set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID.',
      },
      { status: 503 }
    )
  } catch (error: any) {
    console.error('[Auth] Login error:', error?.message)
    return NextResponse.json(
      { message: error?.message || 'Login failed' },
      { status: 401 }
    )
  }
}
