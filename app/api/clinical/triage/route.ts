import { NextRequest, NextResponse } from 'next/server'
import { generateTriagePriority } from '@/lib/bedrock-nova'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chiefComplaint, symptoms, vitalSigns } = body

    if (!chiefComplaint || !symptoms) {
      return NextResponse.json(
        { error: 'Chief complaint and symptoms are required' },
        { status: 400 }
      )
    }

    console.log('[v0] Generating triage priority with Nova')

    // Generate triage priority using Nova Lite
    const triageResult = await generateTriagePriority(chiefComplaint, symptoms, vitalSigns)

    return NextResponse.json({
      success: true,
      triage: triageResult,
    })
  } catch (error) {
    console.error('[v0] Error generating triage:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate triage',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
