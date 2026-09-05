import { NextRequest, NextResponse } from 'next/server';
import { generatePatientSummary } from '@/lib/bedrock-nova';
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
    const { soapNote, clinicalTerms } = body;

    if (!soapNote) {
      return NextResponse.json(
        { error: 'SOAP note is required' },
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

    console.log('[v0] Generating patient-friendly summary with Nova');

    // Generate patient-friendly summary using Nova Lite
    const summary = await generatePatientSummary(soapNote, clinicalTerms);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('[v0] Error generating patient summary:', error);
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
        error: 'Failed to generate patient summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
