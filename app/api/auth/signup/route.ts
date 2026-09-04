import { NextRequest, NextResponse } from 'next/server'
import { createDoctor, createPatient, getDoctorByEmail, getPatientByEmail } from '@/lib/db'
import { signUpWithCognito, getCognitoConfig } from '@/lib/auth/cognito'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, userType, specialty, clinic, doctorId } = body

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
    } else if (process.env.ALLOW_DEV_AUTH !== 'true' && process.env.NODE_ENV === 'production') {
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
          { message: 'Doctor with this email already exists' },
          { status: 409 }
        )
      }

      const doctor = await createDoctor({
        email: email.trim().toLowerCase(),
        name: `${firstName} ${lastName}`.trim(),
        specialty: specialty || 'General Practice',
        clinic: clinic || 'Clinic',
        license: 'LICENSE-PENDING',
      })

      return NextResponse.json({
        success: true,
        message: isConfirmed
          ? 'Doctor account created successfully'
          : 'Doctor account created. Please verify your email with the confirmation code sent to you.',
        userSub,
        isConfirmed,
        doctor: {
          id: doctor.id,
          email: doctor.email,
          name: doctor.name,
        },
      })
    } else {
      const existing = await getPatientByEmail(email)
      if (existing) {
        return NextResponse.json(
          { message: 'Patient with this email already exists' },
          { status: 409 }
        )
      }

      const patient = await createPatient({
        ...(doctorId ? { doctorId } : {}),
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })

      return NextResponse.json({
        success: true,
        message: isConfirmed
          ? 'Patient account created successfully'
          : 'Patient account created. Please verify your email with the confirmation code sent to you.',
        userSub,
        isConfirmed,
        patient: {
          id: patient.id,
          email: patient.email,
          firstName: patient.firstName,
          lastName: patient.lastName,
          ...(patient.doctorId ? { doctorId: patient.doctorId } : {}),
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
