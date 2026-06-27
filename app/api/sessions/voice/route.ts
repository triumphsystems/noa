import { NextRequest, NextResponse } from 'next/server'
import { processVoiceInput, generateRealTimeNotes } from '@/lib/voice-service'
import { updateSession } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userTranscript, sessionContext, patientInfo, transcript } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Processing voice input for session:', sessionId)

    let response = ''
    
    // Process voice input with Sonic for real-time conversation
    if (userTranscript && sessionContext) {
      response = await processVoiceInput(userTranscript, sessionContext, patientInfo)
    }

    // Generate real-time notes when transcript is provided
    let realTimeNotes = null
    if (transcript) {
      realTimeNotes = await generateRealTimeNotes(
        transcript,
        sessionContext || { sessionId, transcript: [], clientIds: [], isRecording: true, doctorId: '', patientId: '' }
      )

      // Update session with real-time notes
      try {
        await updateSession(sessionId, {
          realTimeNotes,
          transcript,
        })
      } catch (error) {
        console.error('[v0] Error updating session notes:', error)
      }
    }

    return NextResponse.json({
      success: true,
      aiResponse: response,
      realTimeNotes,
      sessionId,
    })
  } catch (error) {
    console.error('[v0] Error processing voice input:', error)
    return NextResponse.json(
      {
        error: 'Failed to process voice input',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
