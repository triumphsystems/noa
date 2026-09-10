import { NextRequest, NextResponse } from 'next/server';
import { getClinicaSuggestions } from '@/lib/voice-service';
import { ClinicalAIUnavailableError } from '@/lib/ai/provider';
import { requireAuth } from '@/lib/auth/guard';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, undefined, {
      prefix: 'suggestions',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const body = await request.json();
    const { transcript, sessionId, patientHistory, currentSymptoms } = body;

    if (!transcript) {
      return NextResponse.json(
        { message: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Generate suggestions using Nova Sonic
    const suggestions = await getClinicaSuggestions(
      transcript,
      patientHistory || '',
      currentSymptoms || transcript
    );

    return NextResponse.json({
      success: true,
      suggestions,
      sessionId,
    });
  } catch (error) {
    console.error('[v0] Error generating suggestions:', error);
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
          error instanceof Error
            ? error.message
            : 'Failed to generate suggestions',
      },
      { status: 500 }
    );
  }
}
