import { NextRequest, NextResponse } from 'next/server';
import {
  generateClinicalInsights,
  generateFollowUpPlan,
} from '@/lib/bedrock-nova';
import { ClinicalAIUnavailableError } from '@/lib/ai/provider';
import { requireAuth } from '@/lib/auth/guard';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, undefined, {
      prefix: 'insights',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const body = await request.json();
    const {
      patientHistory,
      currentPresentation,
      previousFindings,
      medications,
      procedures,
    } = body;

    if (!currentPresentation) {
      return NextResponse.json(
        { message: 'Current presentation is required' },
        { status: 400 }
      );
    }

    console.log('[v0] Generating clinical insights with Nova');

    // Generate clinical insights using Nova Pro
    const insights = await generateClinicalInsights(
      patientHistory || '',
      currentPresentation,
      previousFindings || ''
    );

    // Generate follow-up plan if medications or procedures provided
    let followUpPlan = '';
    if (medications || procedures) {
      followUpPlan = await generateFollowUpPlan(
        currentPresentation,
        medications || [],
        procedures
      );
    }

    return NextResponse.json({
      success: true,
      insights,
      followUpPlan,
    });
  } catch (error) {
    console.error('[Insights] Error generating clinical insights:', error);
    if (error instanceof ClinicalAIUnavailableError && error.isThrottling) {
      return NextResponse.json(
        {
          message:
            'AWS Bedrock model capacity exceeded. Please retry in a few moments.',
        },
        { status: 429, headers: { 'Retry-After': '5' } }
      );
    }
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate clinical insights',
      },
      { status: 500 }
    );
  }
}
