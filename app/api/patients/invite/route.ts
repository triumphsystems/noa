import { NextRequest, NextResponse } from 'next/server'
import {
  getDoctorById,
  getPatientByEmail,
  createPatient,
  updatePatient,
} from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

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

    const doctor = await getDoctorById(doctorId)
    if (!doctor) {
      return NextResponse.json({ message: 'Doctor record not found' }, { status: 404 })
    }

    const body = await request.json()
    const { email, firstName, lastName, phone } = body || {}

    if (!email || !email.trim()) {
      return NextResponse.json({ message: 'Patient email is required' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const existingPatient = await getPatientByEmail(cleanEmail)

    let patient
    let isNew = false

    if (existingPatient) {
      // If already assigned to this doctor
      if (existingPatient.doctorId === doctorId) {
        return NextResponse.json(
          {
            success: true,
            data: existingPatient,
            message: 'Patient is already linked to your clinic practice.',
          },
          { status: 200 }
        )
      }

      // Propose link / pending patient approval
      patient = await updatePatient(existingPatient.id, {
        pendingDoctorId: doctorId,
        linkStatus: 'pending_patient_approval',
        linkRequestedBy: 'doctor',
        linkRequestedAt: Date.now(),
        // Update name/phone if not already present
        ...(firstName && !existingPatient.firstName ? { firstName } : {}),
        ...(lastName && !existingPatient.lastName ? { lastName } : {}),
        ...(phone && !existingPatient.phone ? { phone } : {}),
      })
    } else {
      // Patient has not yet signed up: create preliminary record pre-linked to doctor
      isNew = true
      patient = await createPatient({
        email: cleanEmail,
        firstName: firstName?.trim() || 'Pending',
        lastName: lastName?.trim() || 'Patient',
        phone: phone?.trim(),
        doctorId: doctorId,
        linkStatus: 'linked',
        linkRequestedBy: 'doctor',
        linkRequestedAt: Date.now(),
      })
    }

    return NextResponse.json({
      success: true,
      data: patient,
      isNew,
      message: isNew
        ? `Patient record created and linked to Dr. ${doctor.name}.`
        : `Invitation sent to ${patient?.firstName || cleanEmail}. Awaiting patient acceptance on their portal.`,
    })
  } catch (error) {
    console.error('[API /patients/invite] Error inviting patient:', error)
    return NextResponse.json(
      {
        message: 'Failed to invite patient',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
