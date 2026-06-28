import { NextRequest, NextResponse } from 'next/server'
import { createSession, getSessionsByDoctor, getSessionsByPatient, Session } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { doctorId, patientId, transcript, soapNote } = body

    if (!doctorId || !patientId) {
      return NextResponse.json(
        { error: 'doctorId and patientId are required' },
        { status: 400 }
      )
    }

    // Create session in DynamoDB
    const session = await createSession({
      doctorId,
      patientId,
      startedAt: Date.now(),
      transcript,
      status: 'active',
      soapNote: soapNote || undefined,
    })

    return NextResponse.json({
      success: true,
      session,
    })
  } catch (error) {
    console.error('[v0] Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const doctorId = request.nextUrl.searchParams.get('doctorId')
    const patientId = request.nextUrl.searchParams.get('patientId')

    if (!doctorId && !patientId) {
      return NextResponse.json(
        { error: 'Either doctorId or patientId is required' },
        { status: 400 }
      )
    }

    let sessions: Session[] = []

    if (doctorId) {
      sessions = await getSessionsByDoctor(doctorId)
    } else if (patientId) {
      sessions = await getSessionsByPatient(patientId)
    }

    return NextResponse.json({
      success: true,
      sessions,
    })
  } catch (error) {
    console.error('[v0] Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
