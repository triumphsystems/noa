import { NextRequest, NextResponse } from 'next/server'
import { getDoctorByEmail, getPatientByEmail, getAdminByEmail } from '@/lib/db'
import { signInWithCognito, getCognitoConfig, getCognitoUser } from '@/lib/auth/cognito'
import { setAuthCookies } from '@/lib/auth/cookies'
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, userType } = body

    // 1. Rate limiting: max 5 login attempts per minute per client to prevent brute-force
    const clientId = getClientIdentifier(request, email)
    const rateCheck = await checkRateLimit(`login:${clientId}`, { limit: 5, windowSeconds: 60 })
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck)
    }

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { isConfigured } = getCognitoConfig()

    // 2. AWS Cognito Authentication
    if (isConfigured) {
      const tokens = await signInWithCognito(email, password)
      const cognitoUser = await getCognitoUser(tokens.accessToken)

      let resolvedUser = {
        id: cognitoUser?.sub || `user-${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: cognitoUser?.name || email,
        userType: (cognitoUser?.userType || userType || 'doctor') as 'doctor' | 'patient' | 'admin',
      }

      // Cross-reference DynamoDB profile to resolve exact medical or admin record ID
      if (resolvedUser.userType === 'doctor') {
        const doctor = await getDoctorByEmail(email)
        if (doctor) {
          resolvedUser.id = doctor.id
          resolvedUser.name = doctor.name
        }
      } else if (resolvedUser.userType === 'admin') {
        const admin = await getAdminByEmail(email)
        if (admin) {
          resolvedUser.id = admin.id
          resolvedUser.name = admin.name
        }
      } else {
        const patient = await getPatientByEmail(email)
        if (patient) {
          resolvedUser.id = patient.id
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
