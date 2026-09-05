import { NextRequest, NextResponse } from 'next/server'
import { getPatientById } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    const patient = await getPatientById(id)

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    if (auth.userType === 'patient' && id !== auth.sub) {
      return NextResponse.json({ error: 'Forbidden: Cannot access another patient record' }, { status: 403 })
    }

    if (auth.userType === 'doctor') {
      const isLinkedToDoctor = patient.doctorId === auth.sub && patient.linkStatus === 'linked'
      const isPendingDoctor = patient.pendingDoctorId === auth.sub

      if (!isLinkedToDoctor && !isPendingDoctor && patient.doctorId && patient.doctorId !== auth.sub) {
        return NextResponse.json({ error: 'Forbidden: Cannot access patient assigned to another doctor' }, { status: 403 })
      }

      // If pending approval, only allow basic contact details, redact medical records
      if (!isLinkedToDoctor) {
        const sanitized = {
          id: patient.id,
          email: patient.email,
          firstName: patient.firstName,
          lastName: patient.lastName,
          linkStatus: patient.linkStatus,
          linkRequestedAt: patient.linkRequestedAt,
          phone: patient.phone ? `${patient.phone.slice(0, 3)}***` : undefined,
          allergies: [],
          medications: [],
          conditions: [],
        }
        return NextResponse.json({
          success: true,
          patient: sanitized,
        })
      }
    }

    return NextResponse.json({
      success: true,
      patient,
    })
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
