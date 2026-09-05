import { NextRequest, NextResponse } from 'next/server'
import { processVoiceInput, generateRealTimeNotes, transcribeAudio, getClinicaSuggestions } from '@/lib/voice-service'
import { getSessionById, createSession, updateSession, isDoctorVerified } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    let sessionContext: any = null
    let patientInfo = ''
    let legacyTranscript = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      sessionId = (formData.get('sessionId') as string) || ''
      doctorId = (formData.get('doctorId') as string) || ''
      patientId = (formData.get('patientId') as string) || ''
      chunkIndex = parseInt((formData.get('chunkIndex') as string) || '0', 10)
      clientTranscript = (formData.get('clientTranscript') as string) || ''

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
      clientTranscript = body.clientTranscript || ''
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

    // 1. Process legacy voice input if present
    let aiResponse = ''
    if (userTranscript && sessionContext) {
      aiResponse = await processVoiceInput(userTranscript, sessionContext, patientInfo)
    }

    // 2. Transcribe incoming incremental audio chunk via Bedrock Nova Sonic
    let chunkTranscript = ''
    if (audioBuffer && audioBuffer.length > 0) {
      try {
        chunkTranscript = await transcribeAudio(audioBuffer, `${sessionId}-chunk-${chunkIndex}`)
      } catch (err) {
        console.warn(`[Voice Route] Chunk ${chunkIndex} Bedrock transcription warning:`, err)
        if (clientTranscript) {
          chunkTranscript = clientTranscript
        }
      }
    } else if (clientTranscript) {
      chunkTranscript = clientTranscript
    } else if (legacyTranscript) {
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
          doctorId: doctorId || 'doctor-session',
          patientId: patientId || 'patient-session',
          startedAt: Date.now(),
          status: 'active',
          transcript: fullTranscript,
        })
      }

      // Generate contextual clinical suggestions if chunk has meaningful content
      if (chunkTranscript.length > 15) {
        try {
          suggestions = await getClinicaSuggestions(chunkTranscript, '', '')
        } catch (suggErr) {
          console.warn('[Voice Route] Suggestions generation warning:', suggErr)
        }
      }
    } else {
      fullTranscript = session?.transcript || ''
    }

    // 4. Generate real-time notes if requested
    if (legacyTranscript) {
      realTimeNotes = await generateRealTimeNotes(
        legacyTranscript,
        sessionContext || { sessionId, transcript: [], clientIds: [], isRecording: true, doctorId, patientId }
      )
      try {
        await updateSession(sessionId, { realTimeNotes, transcript: fullTranscript })
      } catch (noteErr) {
        console.warn('[Voice Route] Error updating session notes:', noteErr)
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
    console.error('[Voice Route] Error processing voice session:', error)
    return NextResponse.json(
      {
        error: 'Failed to process voice session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
