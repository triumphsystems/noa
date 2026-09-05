import { NextRequest, NextResponse } from 'next/server'
import {
  getPatientById,
  getDoctorById,
  updatePatient,
} from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const patientId = auth.sub
    if (!patientId) {
      return NextResponse.json({ message: 'Patient ID missing from auth token' }, { status: 400 })
    }

    const body = await request.json()
    const { action } = body || {} // 'accept' | 'decline'

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ message: 'Valid action (accept or decline) is required' }, { status: 400 })
    }

    const patient = await getPatientById(patientId)
    if (!patient) {
      return NextResponse.json({ message: 'Patient profile not found' }, { status: 404 })
    }

    if (patient.linkStatus !== 'pending_patient_approval' || !patient.pendingDoctorId) {
      return NextResponse.json(
        { message: 'No pending doctor connection request found.' },
        { status: 400 }
      )
    }

    const doctor = await getDoctorById(patient.pendingDoctorId)

    if (action === 'accept') {
      const updatedPatient = await updatePatient(patient.id, {
        doctorId: patient.pendingDoctorId,
        pendingDoctorId: null as any,
        linkStatus: 'linked',
        linkRequestedAt: Date.now(),
      })

      return NextResponse.json({
        success: true,
        data: {
          patient: updatedPatient,
          doctor,
        },
        message: doctor
          ? `You are now securely connected with Dr. ${doctor.name}.`
          : 'Doctor connection approved.',
      })
    } else {
      // Decline
      const updatedPatient = await updatePatient(patient.id, {
        pendingDoctorId: null as any,
        linkStatus: 'unlinked',
      })

      return NextResponse.json({
        success: true,
        data: {
          patient: updatedPatient,
          doctor: null,
        },
        message: 'Doctor invitation declined.',
      })
    }
  } catch (error) {
    console.error('[API /patients/respond-link] Error responding to doctor invitation:', error)
    return NextResponse.json(
      {
        message: 'Failed to process connection response',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
