import { NextRequest, NextResponse } from 'next/server'
import { getClinicaSuggestions } from '@/lib/voice-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript, sessionId, patientHistory, currentSymptoms } = body

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    // Generate suggestions using Nova Sonic
    const suggestions = await getClinicaSuggestions(
      transcript,
      patientHistory || '',
      currentSymptoms || transcript
    )

    return NextResponse.json({
      success: true,
      suggestions,
      sessionId,
    })
  } catch (error) {
    console.error('[v0] Error generating suggestions:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
