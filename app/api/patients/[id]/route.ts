import { NextRequest, NextResponse } from 'next/server'
import { getPatientById } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

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

    return NextResponse.json({
      success: true,
      patient,
    })
  } catch (error) {
    console.error('[v0] Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
