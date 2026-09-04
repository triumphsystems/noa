import { NextRequest, NextResponse } from 'next/server'

import type { ApiSuccess } from '@/lib/types/api.types'
import type { DoctorDashboardPayload } from '@/lib/types/doctor.types'
import { getDoctorById, getPatientsByDoctor, getSessionsByDoctor } from '@/lib/db'
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

    const [doctor, patients, sessions] = await Promise.all([
      getDoctorById(doctorId),
      getPatientsByDoctor(doctorId),
      getSessionsByDoctor(doctorId),
    ])

    if (!doctor) {
      return NextResponse.json({ message: 'Doctor not found' }, { status: 404 })
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

    const dashboard: DoctorDashboardPayload = {
      doctor,
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
