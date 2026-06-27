import { NextRequest, NextResponse } from 'next/server'
import { generateSOAPWithNova } from '@/lib/bedrock-nova'
import { updateSession } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript, patientInfo, sessionId, patientId } = body

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Generating SOAP note with Nova AI')

    // Generate SOAP note using Nova Lite via Bedrock
    const soapNote = await generateSOAPWithNova(transcript, patientInfo || '')

    // If sessionId provided, update session in DynamoDB
    if (sessionId) {
      try {
        await updateSession(sessionId, {
          soapNote: {
            subjective: soapNote.subjective || '',
            objective: soapNote.objective || '',
            assessment: soapNote.assessment || '',
            plan: soapNote.plan || '',
            generatedAt: Date.now(),
          },
          transcript,
          status: 'completed',
        })
      } catch (dbError) {
        console.error('[v0] Error updating session in DB:', dbError)
        // Continue even if DB update fails - SOAP note still generated
      }
    }

    return NextResponse.json({
      success: true,
      soapNote,
      sessionId,
    })
  } catch (error) {
    console.error('[v0] Error generating SOAP note:', error)
    return NextResponse.json(
      { error: 'Failed to generate SOAP note', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
