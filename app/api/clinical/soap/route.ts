import { NextRequest, NextResponse } from 'next/server'
import { generateSOAPNote } from '@/lib/bedrock-service'
import { updateSession, getSessionById } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript, patientInfo, sessionId } = body

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Generating SOAP note from transcript')

    // Call Bedrock to generate SOAP note
    const soapNote = await generateSOAPNote(transcript, patientInfo || '')

    // If sessionId provided, update session with SOAP note in DynamoDB
    if (sessionId) {
      await updateSession(sessionId, {
        soapNote: {
          subjective: soapNote.subjective || '',
          objective: soapNote.objective || '',
          assessment: soapNote.assessment || '',
          plan: soapNote.plan || '',
          generatedAt: Date.now(),
        },
        transcript,
      })
    }

    return NextResponse.json({
      success: true,
      soapNote,
    })
  } catch (error) {
    console.error('[v0] Error generating SOAP note:', error)
    return NextResponse.json(
      { error: 'Failed to generate SOAP note', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
