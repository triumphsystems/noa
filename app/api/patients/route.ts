import { NextRequest, NextResponse } from 'next/server'
import { getPatientsByDoctor } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const doctorId = request.nextUrl.searchParams.get('doctorId')

    if (!doctorId) {
      return NextResponse.json(
        { error: 'doctorId is required' },
        { status: 400 }
      )
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
