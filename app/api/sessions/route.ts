import { NextRequest, NextResponse } from 'next/server'
import { createSession, updateSession, getSessionsByDoctor, getSessionsByPatient, getSessionById, Session } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { doctorId, patientId, transcript, soapNote, sessionId, id } = body

    if (!doctorId || !patientId) {
      return NextResponse.json(
        { error: 'doctorId and patientId are required' },
        { status: 400 }
      )
    }

    const callerId = auth.dbId || auth.sub
    if (auth.userType === 'doctor' && callerId && callerId !== doctorId) {
      return NextResponse.json({ error: 'Forbidden: Cannot manage sessions for another doctor' }, { status: 403 })
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
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = request.nextUrl.searchParams.get('sessionId')
    const doctorId = request.nextUrl.searchParams.get('doctorId')
    const patientId = request.nextUrl.searchParams.get('patientId')
    const callerId = auth.dbId || auth.sub

    if (sessionId) {
      const session = await getSessionById(sessionId)
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      // BOLA check: only the session's doctor or patient can view it
      if (
        callerId !== session.doctorId &&
        callerId !== session.patientId
      ) {
        return NextResponse.json({ error: 'Forbidden: Access denied to this session' }, { status: 403 })
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
      if (auth.userType === 'doctor' && callerId !== doctorId) {
        return NextResponse.json({ error: 'Forbidden: Cannot list sessions for another doctor' }, { status: 403 })
      }
      sessions = await getSessionsByDoctor(doctorId)
    } else if (patientId) {
      if (auth.userType === 'patient' && callerId !== patientId) {
        return NextResponse.json({ error: 'Forbidden: Cannot list sessions for another patient' }, { status: 403 })
      }
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
