import { NextRequest, NextResponse } from 'next/server'
import { generateSOAPNote } from '@/lib/bedrock-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript, patientInfo } = body

    if (!transcript) {
      return NextResponse.json(
        { message: 'Transcript is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Generating SOAP note from transcript')

    // Call Bedrock to generate SOAP note
    const soapNote = await generateSOAPNote(transcript, patientInfo || '')

    return NextResponse.json({
      success: true,
      soapNote,
    })
  } catch (error) {
    console.error('[v0] Error generating SOAP note:', error)
    return NextResponse.json(
      { message: 'Failed to generate SOAP note' },
      { status: 500 }
    )
  }
}
