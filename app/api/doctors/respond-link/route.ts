import { NextRequest, NextResponse } from 'next/server'
import {
  getPatientById,
  getDoctorById,
  updatePatient,
} from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

/**
 * POST /api/doctors/respond-link
 * Allows a doctor to accept or decline a connection request initiated by a patient.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (auth.userType && auth.userType !== 'doctor') {
      return NextResponse.json({ message: 'Forbidden: Doctor role required' }, { status: 403 })
    }

    const doctorId = auth.sub
    if (!doctorId) {
      return NextResponse.json({ message: 'Doctor ID missing from auth token' }, { status: 400 })
    }

    const body = await request.json()
    const { patientId, action } = body || {} // action: 'accept' | 'decline'

    if (!patientId) {
      return NextResponse.json({ message: 'patientId is required' }, { status: 400 })
    }

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ message: 'Valid action (accept or decline) is required' }, { status: 400 })
    }

    const patient = await getPatientById(patientId)
    if (!patient) {
      return NextResponse.json({ message: 'Patient profile not found' }, { status: 404 })
    }

    // Verify that the patient has a pending request specifically targeting this doctor
    if (patient.linkStatus !== 'pending_doctor_approval' || patient.pendingDoctorId !== doctorId) {
      return NextResponse.json(
        { message: 'No pending connection request from this patient found for your account.' },
        { status: 400 }
      )
    }

    const doctor = await getDoctorById(doctorId)
    if (!doctor) {
      return NextResponse.json({ message: 'Doctor profile not found' }, { status: 404 })
    }

    if (doctor.verificationStatus !== 'verified') {
      return NextResponse.json(
        {
          message: 'Your medical credentials must be verified by clinical administration before connecting with patients.',
          verificationStatus: doctor.verificationStatus,
        },
        { status: 403 }
      )
    }

    if (action === 'accept') {
      const updatedPatient = await updatePatient(patient.id, {
        doctorId: doctorId,
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
        message: `Patient ${patient.firstName} ${patient.lastName} has been approved and linked to your practice.`,
      })
    } else {
      // Decline connection request
      const updatedPatient = await updatePatient(patient.id, {
        pendingDoctorId: null as any,
        linkStatus: 'unlinked',
      })

      return NextResponse.json({
        success: true,
        data: {
          patient: updatedPatient,
        },
        message: 'Patient connection request declined.',
      })
    }
  } catch (error) {
    console.error('[API /doctors/respond-link] Error processing patient connection:', error)
    return NextResponse.json(
      {
        message: 'Failed to process connection request',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
