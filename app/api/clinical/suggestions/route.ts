import { NextRequest, NextResponse } from 'next/server';
import { getClinicaSuggestions } from '@/lib/voice-service';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from '@/lib/ratelimit';
import { ClinicalAIUnavailableError } from '@/lib/ai/provider';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transcript, sessionId, patientHistory, currentSymptoms } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Rate limiting: max 20 requests per minute per client
    const clientId = getClientIdentifier(request);
    const rateCheck = await checkRateLimit(clientId, {
      limit: 20,
      windowSeconds: 60,
    });
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
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
          error: 'Too Many Requests',
          message:
            'AWS Bedrock model capacity exceeded. Please retry in a few moments.',
        },
        { status: 429, headers: { 'Retry-After': '5' } }
      );
    }
    return NextResponse.json(
      {
        error: 'Failed to generate suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
