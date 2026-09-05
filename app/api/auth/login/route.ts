import { NextRequest, NextResponse } from 'next/server'
import {
  getDoctorByEmail,
  getDoctorById,
  migrateDoctorId,
  getPatientByEmail,
  getPatientById,
  migratePatientId,
  getAdminByEmail,
} from '@/lib/db'
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

      const cleanEmail = resolvedUser.email

      // The canonical ID is the Cognito Auth ID (cognitoUser.sub).
      // If a legacy doctor or patient profile exists under an old ID, migrate it.
      if (resolvedUser.userType === 'doctor') {
        let doctor = await getDoctorById(resolvedUser.id)
        if (!doctor) {
          const legacyDoctor = await getDoctorByEmail(cleanEmail)
          if (legacyDoctor) {
            doctor = await migrateDoctorId(legacyDoctor.id, resolvedUser.id)
          }
        }
        if (doctor) {
          resolvedUser.name = doctor.name
        }
      } else if (resolvedUser.userType === 'admin') {
        const admin = await getAdminByEmail(cleanEmail)
        if (admin) {
          resolvedUser.name = admin.name
        }
      } else {
        let patient = await getPatientById(resolvedUser.id)
        if (!patient) {
          const legacyPatient = await getPatientByEmail(cleanEmail)
          if (legacyPatient) {
            patient = await migratePatientId(legacyPatient.id, resolvedUser.id)
          }
        }
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
