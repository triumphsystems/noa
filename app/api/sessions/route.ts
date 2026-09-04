import { NextRequest, NextResponse } from 'next/server'
import { createSession, updateSession, getSessionsByDoctor, getSessionsByPatient, getSessionById, Session } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { doctorId, patientId, transcript, soapNote, sessionId, id } = body

    if (!doctorId || !patientId) {
      return NextResponse.json(
        { error: 'doctorId and patientId are required' },
        { status: 400 }
      )
    }

    const targetId = sessionId || id
    let session: Session | null = null

    if (targetId) {
      const existing = await getSessionById(targetId)
      if (existing) {
        session = await updateSession(targetId, {
          doctorId,
          patientId,
          transcript: transcript || existing.transcript,
          status: 'completed',
          endedAt: Date.now(),
          soapNote: soapNote || existing.soapNote,
        })
      }
    }

    if (!session) {
      session = await createSession({
        ...(targetId ? { id: targetId } : {}),
        doctorId,
        patientId,
        startedAt: Date.now(),
        endedAt: Date.now(),
        transcript,
        status: 'completed',
        soapNote: soapNote || undefined,
      })
    }

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
    const sessionId = request.nextUrl.searchParams.get('sessionId')
    const doctorId = request.nextUrl.searchParams.get('doctorId')
    const patientId = request.nextUrl.searchParams.get('patientId')

    if (sessionId) {
      const session = await getSessionById(sessionId)
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        session,
      })
    }

    if (!doctorId && !patientId) {
      return NextResponse.json(
        { error: 'Either sessionId, doctorId, or patientId is required' },
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
