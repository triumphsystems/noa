import { NextRequest, NextResponse } from 'next/server'
import { processVoiceInput, generateRealTimeNotes, transcribeAudio, getClinicaSuggestions } from '@/lib/voice-service'
import { getSessionById, createSession, updateSession, isDoctorVerified } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.isValid || !auth.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting: max 30 voice chunks per minute per authenticated user
    const clientId = `voice:${auth.sub}`
    const rateCheck = await checkRateLimit(clientId, { limit: 30, windowSeconds: 60 })
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck)
    }

    if (auth.userType === 'doctor') {
      const verified = await isDoctorVerified(auth.sub)
      if (!verified) {
        return NextResponse.json(
          { error: 'Forbidden: Your medical license is pending review. Voice consultation is locked until verified.' },
          { status: 403 }
        )
      }
    }

    const contentType = request.headers.get('content-type') || ''
    let sessionId = ''
    let doctorId = ''
    let patientId = ''
    let chunkIndex = 0
    let audioBuffer: Buffer | null = null
    let clientTranscript = ''
    let userTranscript = ''
    let sessionContext: Record<string, unknown> | null = null
    let patientInfo = ''
    let legacyTranscript = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      sessionId = (formData.get('sessionId') as string) || ''
      doctorId = (formData.get('doctorId') as string) || ''
      patientId = (formData.get('patientId') as string) || ''
      chunkIndex = parseInt((formData.get('chunkIndex') as string) || '0', 10)
      // Do NOT accept clientTranscript from multipart — server-side transcription only
      const audioFile = formData.get('audio') as File | null
      if (audioFile) {
        const arrayBuffer = await audioFile.arrayBuffer()
        audioBuffer = Buffer.from(arrayBuffer)
      }
    } else {
      const body = await request.json()
      sessionId = body.sessionId || ''
      doctorId = body.doctorId || ''
      patientId = body.patientId || ''
      chunkIndex = body.chunkIndex || 0
      userTranscript = body.userTranscript || ''
      sessionContext = body.sessionContext || null
      patientInfo = body.patientInfo || ''
      legacyTranscript = body.transcript || ''

      if (body.audioBase64) {
        audioBuffer = Buffer.from(body.audioBase64, 'base64')
      }
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Enforce that doctorId and patientId must be provided
    if (!doctorId || !patientId) {
      return NextResponse.json(
        { error: 'doctorId and patientId are required' },
        { status: 400 }
      )
    }

    // BOLA: verify the calling doctor owns this session's doctorId
    if (auth.userType === 'doctor' && doctorId !== auth.sub) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot submit voice for another doctor\'s session' },
        { status: 403 }
      )
    }

    // 1. Process legacy voice input if present
    let aiResponse = ''
    if (userTranscript && sessionContext) {
      aiResponse = await processVoiceInput(userTranscript, sessionContext as never, patientInfo)
    }

    // 2. Transcribe incoming audio chunk via Bedrock.
    //    Client-supplied transcripts are NOT accepted as fallback to prevent injection.
    let chunkTranscript = ''
    if (audioBuffer && audioBuffer.length > 0) {
      try {
        chunkTranscript = await transcribeAudio(audioBuffer, `${sessionId}-chunk-${chunkIndex}`)
      } catch (err) {
        console.warn(`[Voice] Chunk ${chunkIndex} transcription failed:`, err)
        // Do not fall back to client transcript — return partial success instead
      }
    } else if (legacyTranscript) {
      // Accept server-side legacy transcript field only (not client-side bypass)
      chunkTranscript = legacyTranscript
    }

    // 3. Atomically update session in DynamoDB
    let fullTranscript = ''
    let suggestions: string[] = []
    let realTimeNotes = null

    const session = await getSessionById(sessionId)

    if (chunkTranscript.trim()) {
      if (session) {
        fullTranscript = session.transcript
          ? `${session.transcript}\n${chunkTranscript.trim()}`
          : chunkTranscript.trim()
        await updateSession(sessionId, { transcript: fullTranscript })
      } else {
        fullTranscript = chunkTranscript.trim()
        await createSession({
          id: sessionId,
          doctorId,
          patientId,
          startedAt: Date.now(),
          status: 'active',
          transcript: fullTranscript,
        })
      }

      // Generate clinical suggestions only for meaningful chunk sizes (100+ chars)
      if (chunkTranscript.length > 100) {
        try {
          suggestions = await getClinicaSuggestions(chunkTranscript, '', '')
        } catch (suggErr) {
          console.warn('[Voice] Suggestions generation warning:', suggErr)
          suggestions = []
        }
      }
    } else {
      fullTranscript = session?.transcript || ''
    }

    // 4. Generate real-time notes if legacy transcript is provided
    if (legacyTranscript) {
      try {
        realTimeNotes = await generateRealTimeNotes(
          legacyTranscript,
          sessionContext as never || { sessionId, transcript: [], isRecording: true, doctorId, patientId }
        )
        await updateSession(sessionId, { realTimeNotes, transcript: fullTranscript })
      } catch (noteErr) {
        console.warn('[Voice] Error generating real-time notes:', noteErr)
      }
    }

    return NextResponse.json({
      success: true,
      sessionId,
      chunkIndex,
      chunkTranscript,
      fullTranscript,
      suggestions,
      aiResponse,
      realTimeNotes,
    })
  } catch (error) {
    console.error('[Voice] Error processing voice session:', error)
    return NextResponse.json(
      {
        error: 'Failed to process voice session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
