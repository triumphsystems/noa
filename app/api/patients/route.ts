import { NextRequest, NextResponse } from 'next/server'
import { getPatientsByDoctor, isDoctorVerified } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid || !auth.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestedDoctorId = request.nextUrl.searchParams.get('doctorId')
    const doctorId = auth.userType === 'admin' && requestedDoctorId ? requestedDoctorId : auth.sub

    if (auth.userType === 'doctor') {
      if (requestedDoctorId && requestedDoctorId !== auth.sub) {
        return NextResponse.json({ error: 'Forbidden: Cannot list patients for another doctor' }, { status: 403 })
      }

      const verified = await isDoctorVerified(auth.sub)
      if (!verified) {
        return NextResponse.json(
          { error: 'Forbidden: Medical license verification is pending.' },
          { status: 403 }
        )
      }
    }

    const patients = await getPatientsByDoctor(doctorId)

    return NextResponse.json({
      success: true,
      patients,
    })
  } catch (error) {
    console.error('[v0] Error fetching patients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patients', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
