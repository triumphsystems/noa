import { NextRequest, NextResponse } from 'next/server'
import {
  getPatientById,
  getDoctorById,
  getDoctorByCareCode,
  updatePatient,
  computeDoctorCareCode,
} from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { doctorId, careCode } = body || {}

    if (!doctorId && !careCode) {
      return NextResponse.json(
        { message: 'Either doctorId or careCode is required' },
        { status: 400 }
      )
    }

    // Resolve caller patient
    const patientId = auth.dbId || auth.sub
    if (!patientId) {
      return NextResponse.json({ message: 'Missing patient identity in token' }, { status: 400 })
    }

    const patient = await getPatientById(patientId)
    if (!patient) {
      return NextResponse.json({ message: 'Patient profile not found' }, { status: 404 })
    }

    // Locate doctor
    let targetDoctor = null
    if (careCode) {
      targetDoctor = await getDoctorByCareCode(careCode)
    } else if (doctorId) {
      targetDoctor = await getDoctorById(doctorId)
    }

    if (!targetDoctor) {
      return NextResponse.json(
        { message: 'Doctor not found with the provided code or ID' },
        { status: 404 }
      )
    }

    // Connect patient to doctor:
    // When patient initiates with a valid careCode or selecting doctor, link directly
    // and record link status as 'linked'.
    const updatedPatient = await updatePatient(patient.id, {
      doctorId: targetDoctor.id,
      linkStatus: 'linked',
      linkRequestedBy: 'patient',
      linkRequestedAt: Date.now(),
    })

    return NextResponse.json({
      success: true,
      data: {
        patient: updatedPatient,
        doctor: {
          id: targetDoctor.id,
          name: targetDoctor.name,
          specialty: targetDoctor.specialty,
          clinic: targetDoctor.clinic,
          careCode: targetDoctor.careCode || computeDoctorCareCode(targetDoctor),
          email: targetDoctor.email,
        },
      },
      message: `Successfully connected to Dr. ${targetDoctor.name}`,
    })
  } catch (error) {
    console.error('[API /doctors/connect] Error connecting to doctor:', error)
    return NextResponse.json(
      {
        message: 'Failed to connect to doctor',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
