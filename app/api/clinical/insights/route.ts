import { NextRequest, NextResponse } from 'next/server'
import { generateClinicalInsights } from '@/lib/bedrock-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript } = body

    if (!transcript) {
      return NextResponse.json(
        { message: 'Transcript is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Generating clinical insights')

    // Call Bedrock to generate insights
    const insights = await generateClinicalInsights(transcript)

    return NextResponse.json({
      success: true,
      insights,
    })
  } catch (error) {
    console.error('[v0] Error generating insights:', error)
    return NextResponse.json(
      { message: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
