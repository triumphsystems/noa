import { NextRequest, NextResponse } from 'next/server'
import { createDoctor, createPatient, getDoctorByEmail, getPatientsByDoctor } from '@/lib/db'

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

    // Check if doctor already exists
    if (userType === 'doctor') {
      const existing = await getDoctorByEmail(email)
      if (existing) {
        return NextResponse.json(
          { message: 'Doctor with this email already exists' },
          { status: 409 }
        )
      }

      // Create doctor in DynamoDB
      const doctor = await createDoctor({
        email,
        name: `${firstName} ${lastName}`,
        specialty: specialty || 'General Practice',
        clinic: clinic || 'Clinic',
        license: 'LICENSE-PENDING',
      })

      return NextResponse.json({
        success: true,
        message: 'Doctor account created successfully',
        doctor: {
          id: doctor.id,
          email: doctor.email,
          name: doctor.name,
        },
      })
    } else if (userType === 'patient') {
      if (!doctorId) {
        return NextResponse.json(
          { message: 'Doctor ID is required for patient signup' },
          { status: 400 }
        )
      }

      // Create patient in DynamoDB
      const patient = await createPatient({
        doctorId,
        email,
        firstName,
        lastName,
      })

      return NextResponse.json({
        success: true,
        message: 'Patient account created successfully',
        patient: {
          id: patient.id,
          email: patient.email,
          firstName: patient.firstName,
          lastName: patient.lastName,
        },
      })
    }

    return NextResponse.json(
      { message: 'Invalid user type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Signup error:', error)
    return NextResponse.json(
      { message: 'Signup failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
