import { NextRequest, NextResponse } from 'next/server'
import { getPatientsByDoctor } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctorId = request.nextUrl.searchParams.get('doctorId')

    if (!doctorId) {
      return NextResponse.json(
        { error: 'doctorId is required' },
        { status: 400 }
      )
    }

    const callerId = auth.dbId || auth.sub
    if (callerId && callerId !== doctorId) {
      return NextResponse.json({ error: 'Forbidden: Cannot list patients for another doctor' }, { status: 403 })
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
