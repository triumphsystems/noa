import { NextRequest, NextResponse } from 'next/server'
import { generatePatientSummary } from '@/lib/bedrock-nova'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { soapNote, clinicalTerms } = body

    if (!soapNote) {
      return NextResponse.json(
        { error: 'SOAP note is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Generating patient-friendly summary with Nova')

    // Generate patient-friendly summary using Nova Lite
    const summary = await generatePatientSummary(soapNote, clinicalTerms)

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error) {
    console.error('[v0] Error generating patient summary:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate patient summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
