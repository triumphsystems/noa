import { NextRequest, NextResponse } from 'next/server'

import type { ApiSuccess } from '@/lib/types/api.types'
import type { DoctorDashboardPayload } from '@/lib/types/doctor.types'
import { getDoctorById, getPatientsByDoctor, getPendingPatientsByDoctor, getSessionsByDoctor } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (auth.userType && auth.userType !== 'doctor') {
      return NextResponse.json({ message: 'Forbidden: Doctor role required' }, { status: 403 })
    }

    const doctorId = request.nextUrl.searchParams.get('doctorId')

    if (!doctorId) {
      return NextResponse.json({ message: 'doctorId is required' }, { status: 400 })
    }

    const callerId = auth.dbId || auth.sub
    if (callerId && callerId !== doctorId) {
      return NextResponse.json({ message: 'Forbidden: Cannot access another doctor dashboard' }, { status: 403 })
    }

    const [doctor, linkedPatients, pendingPatients, sessions] = await Promise.all([
      getDoctorById(doctorId),
      getPatientsByDoctor(doctorId),
      getPendingPatientsByDoctor(doctorId),
      getSessionsByDoctor(doctorId),
    ])

    // Combine linked and pending patients, avoiding duplicates
    const patientMap = new Map()
    linkedPatients.forEach(p => patientMap.set(p.id, p))
    pendingPatients.forEach(p => {
      if (!patientMap.has(p.id)) patientMap.set(p.id, p)
    })
    const patients = Array.from(patientMap.values())

    if (!doctor) {
      return NextResponse.json({ message: 'Doctor not found' }, { status: 404 })
    }

    // Enforce credential verification: pending or rejected accounts cannot access clinical dashboard
    if (doctor.verificationStatus === 'pending') {
      return NextResponse.json(
        {
          message: 'Your medical credentials are currently under review by clinical administration.',
          verificationStatus: 'pending',
          doctor,
        },
        { status: 403 }
      )
    }

    if (doctor.verificationStatus === 'rejected') {
      return NextResponse.json(
        {
          message: 'Your medical verification request was rejected.',
          verificationStatus: 'rejected',
          rejectionReason: doctor.rejectionReason,
          doctor,
        },
        { status: 403 }
      )
    }

    const today = new Date()
    const stats = {
      totalPatients: patients.length,
      totalSessions: sessions.length,
      completedSessions: sessions.filter(session => session.status === 'completed').length,
      activeSessions: sessions.filter(session => session.status === 'active').length,
      pendingNotes: sessions.filter(session => session.status === 'active' && !session.soapNote).length,
      todaySessions: sessions.filter(session => new Date(session.startedAt).toDateString() === today.toDateString()).length,
    }

    const doctorWithCareCode = {
      ...doctor,
      careCode: doctor.careCode || (doctor.id ? `NOA-${doctor.id.replace('doctor-', '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}` : 'NOA-DOC'),
    }

    const dashboard: DoctorDashboardPayload = {
      doctor: doctorWithCareCode,
      patients,
      sessions: [...sessions].sort((a, b) => b.startedAt - a.startedAt),
      stats,
    }

    const response: ApiSuccess<DoctorDashboardPayload> = {
      success: true,
      data: dashboard,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[v0] Error loading doctor dashboard:', error)
    return NextResponse.json(
      {
        message: 'Failed to load doctor dashboard',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
