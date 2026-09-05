import { NextRequest, NextResponse } from 'next/server'
import {
  getDoctorById,
  getPatientById,
  getAdminByEmail,
} from '@/lib/db'
import { signInWithCognito, getCognitoConfig, getCognitoUser } from '@/lib/auth/cognito'
import { setAuthCookies } from '@/lib/auth/cookies'
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, userType } = body

    // Validate input FIRST before rate limiting, so we don't use 'undefined' as the rate-limit key
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    // Rate limiting: max 5 login attempts per minute per client (uses validated email)
    const clientId = getClientIdentifier(request, email)
    const rateCheck = await checkRateLimit(`login:${clientId}`, { limit: 5, windowSeconds: 60 })
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck)
    }

    const { isConfigured } = getCognitoConfig()

    // 2. AWS Cognito Authentication
    if (isConfigured) {
      const tokens = await signInWithCognito(email, password)
      const cognitoUser = await getCognitoUser(tokens.accessToken)

      const canonicalId = cognitoUser?.sub || `user-${Date.now()}`
      let resolvedUser = {
        id: canonicalId,
        email: email.trim().toLowerCase(),
        name: cognitoUser?.name || email,
        userType: (cognitoUser?.userType || userType || 'doctor') as 'doctor' | 'patient' | 'admin',
      }

      // Populate display name directly from canonical profile
      if (resolvedUser.userType === 'doctor') {
        const doctor = await getDoctorById(resolvedUser.id)
        if (doctor) {
          resolvedUser.name = doctor.name
        }
      } else if (resolvedUser.userType === 'admin') {
        const admin = await getAdminByEmail(resolvedUser.email)
        if (admin) {
          resolvedUser.name = admin.name
        }
      } else {
        const patient = await getPatientById(resolvedUser.id)
        if (patient) {
          resolvedUser.name = `${patient.firstName} ${patient.lastName}`.trim()
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
