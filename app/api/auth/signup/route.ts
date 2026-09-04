import { NextRequest, NextResponse } from 'next/server'
import { createDoctor, createPatient, updatePatient, getDoctorByEmail, getPatientByEmail } from '@/lib/db'
import { signUpWithCognito, getCognitoConfig } from '@/lib/auth/cognito'
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, userType, specialty, clinic, doctorId, license, issuingAuthority, licenseDocumentUrl } = body

    // 1. Rate limiting: max 5 signups per minute per client
    const clientId = getClientIdentifier(request, email)
    const rateCheck = await checkRateLimit(`signup:${clientId}`, { limit: 5, windowSeconds: 60 })
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck)
    }

    // Validate input
    if (!email || !password || !firstName || !lastName || !userType) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      )
    }

    if (userType !== 'doctor' && userType !== 'patient') {
      return NextResponse.json(
        { message: 'Invalid user type. Must be doctor or patient.' },
        { status: 400 }
      )
    }

    const { isConfigured } = getCognitoConfig()

    // 1. AWS Cognito Registration
    let userSub = ''
    let isConfirmed = false

    if (isConfigured) {
      const result = await signUpWithCognito({
        email,
        password,
        userType,
        firstName,
        lastName,
      })
      userSub = result.userSub
      isConfirmed = result.isConfirmed
    } else {
      return NextResponse.json(
        { message: 'AWS Cognito User Pool is not configured for registration.' },
        { status: 503 }
      )
    }

    // 2. DynamoDB Medical Profile Record
    if (userType === 'doctor') {
      const existing = await getDoctorByEmail(email)
      if (existing) {
        return NextResponse.json(
          { message: 'An account with this email address already exists. Please sign in or reset your password.' },
          { status: 409 }
        )
      }

      const doctor = await createDoctor({
        ...(userSub ? { id: userSub } : {}),
        email: email.trim().toLowerCase(),
        name: `${firstName} ${lastName}`.trim(),
        specialty: specialty || 'General Practice',
        clinic: clinic || 'Clinic',
        license: license ? license.trim() : 'LICENSE-PENDING',
        issuingAuthority: issuingAuthority?.trim(),
        licenseDocumentUrl: licenseDocumentUrl?.trim(),
        verificationStatus: 'pending',
      })

      return NextResponse.json({
        success: true,
        message: isConfirmed
          ? 'Doctor account created and submitted for clinical administration review.'
          : 'Doctor account created. Please verify your email with the confirmation code sent to you. Your medical credentials are pending administrator review.',
        userSub,
        isConfirmed,
        doctor: {
          id: doctor.id,
          email: doctor.email,
          name: doctor.name,
          verificationStatus: doctor.verificationStatus,
        },
      })
    } else {
      const existing = await getPatientByEmail(email)
      let patient: any = null

      if (existing) {
        // Check if existing record was a pre-created invitation (i.e. starts with patient- and no registered user)
        // or an already-registered patient account with a Cognito sub ID
        const isPreCreatedInvite = existing.id.startsWith('patient-') && (!existing.firstName || existing.firstName === 'Pending' || existing.linkStatus === 'linked')
        
        if (!isPreCreatedInvite && existing.id === userSub) {
          return NextResponse.json(
            { message: 'An account with this email address already exists. Please sign in or reset your password.' },
            { status: 409 }
          )
        }

        // If it was a pre-created invitation from a clinician, bind it to this registering user
        patient = await updatePatient(existing.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          ...(doctorId && !existing.doctorId ? { doctorId } : {}),
        })
      } else {
        patient = await createPatient({
          ...(userSub ? { id: userSub } : {}),
          ...(doctorId ? { doctorId } : {}),
          email: email.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        })
      }

      return NextResponse.json({
        success: true,
        message: isConfirmed
          ? 'Patient account created successfully'
          : 'Patient account created. Please verify your email with the confirmation code sent to you.',
        userSub,
        isConfirmed,
        patient: {
          id: patient?.id || userSub,
          email: patient?.email || email,
          firstName: patient?.firstName || firstName,
          lastName: patient?.lastName || lastName,
          ...(patient?.doctorId ? { doctorId: patient.doctorId } : {}),
        },
      })
    }
  } catch (error: any) {
    console.error('[Auth] Signup error:', error?.message)
    return NextResponse.json(
      { message: error?.message || 'Registration failed' },
      { status: 400 }
    )
  }
}
