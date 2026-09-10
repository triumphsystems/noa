import { NextRequest, NextResponse } from 'next/server';
import { generatePatientSummary } from '@/lib/bedrock-nova';
import { ClinicalAIUnavailableError } from '@/lib/ai/provider';
import { requireAuth } from '@/lib/auth/guard';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, undefined, {
      prefix: 'summary',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const body = await request.json();
    const { soapNote, clinicalTerms } = body;

    if (!soapNote) {
      return NextResponse.json(
        { message: 'SOAP note is required' },
        { status: 400 }
      );
    }

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
            : 'Failed to generate patient summary',
      },
      { status: 500 }
    );
  }
}
