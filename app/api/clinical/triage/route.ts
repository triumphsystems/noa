import { NextRequest, NextResponse } from 'next/server';
import { generateTriagePriority } from '@/lib/bedrock-nova';
import { ClinicalAIUnavailableError } from '@/lib/ai/provider';
import { requireAuth } from '@/lib/auth/guard';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, undefined, {
      prefix: 'triage',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const body = await request.json();
    const { chiefComplaint, symptoms, vitalSigns } = body;

    if (!chiefComplaint || !symptoms) {
      return NextResponse.json(
        { message: 'Chief complaint and symptoms are required' },
        { status: 400 }
      );
    }

    // Generate triage priority using Nova Lite
    const triageResult = await generateTriagePriority(
      chiefComplaint,
      symptoms,
      vitalSigns
    );

    return NextResponse.json({
      success: true,
      triage: triageResult,
    });
  } catch (error) {
    console.error('[Triage] Error generating triage:', error);
    if (error instanceof ClinicalAIUnavailableError && error.isThrottling) {
      return NextResponse.json(
        {
          message:
            'Model capacity exceeded. Please retry in a few moments.',
        },
        { status: 429, headers: { 'Retry-After': '5' } }
      );
    }
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Failed to generate triage',
      },
      { status: 500 }
    );
  }
}
