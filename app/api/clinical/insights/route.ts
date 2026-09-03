import { NextRequest, NextResponse } from 'next/server'
import { generateClinicalInsights, generateFollowUpPlan } from '@/lib/bedrock-nova'
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/ratelimit'
import { ClinicalAIUnavailableError } from '@/lib/ai/provider'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientHistory, currentPresentation, previousFindings, medications, procedures } = body

    if (!currentPresentation) {
      return NextResponse.json(
        { error: 'Current presentation is required' },
        { status: 400 }
      )
    }

    // Rate limiting: max 20 requests per minute per client
    const clientId = getClientIdentifier(request)
    const rateCheck = await checkRateLimit(clientId, { limit: 20, windowSeconds: 60 })
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck)
    }

    console.log('[v0] Generating clinical insights with Nova')

    // Generate clinical insights using Nova Pro
    const insights = await generateClinicalInsights(
      patientHistory || '',
      currentPresentation,
      previousFindings || ''
    )

    // Generate follow-up plan if medications or procedures provided
    let followUpPlan = ''
    if (medications || procedures) {
      followUpPlan = await generateFollowUpPlan(
        currentPresentation,
        medications || [],
        procedures
      )
    }

    return NextResponse.json({
      success: true,
      insights,
      followUpPlan,
    })
  } catch (error) {
    console.error('[v0] Error generating clinical insights:', error)
    if (error instanceof ClinicalAIUnavailableError && error.isThrottling) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'AWS Bedrock model capacity exceeded. Please retry in a few moments.' },
        { status: 429, headers: { 'Retry-After': '5' } }
      )
    }
    return NextResponse.json(
      {
        error: 'Failed to generate clinical insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
