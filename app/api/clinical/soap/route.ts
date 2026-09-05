import { NextRequest, NextResponse } from 'next/server';
import { generateSOAPWithNova } from '@/lib/bedrock-nova';
import { updateSession } from '@/lib/db';
import { checkRateLimit, rateLimitResponse } from '@/lib/ratelimit';
import { ClinicalAIUnavailableError } from '@/lib/ai/provider';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.isValid || !auth.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transcript, patientInfo, sessionId } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Rate limiting: use verified auth.sub — never body fields
    const rateCheck = await checkRateLimit(`soap:${auth.sub}`, {
      limit: 20,
      windowSeconds: 60,
    });
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

    console.log('[SOAP] Generating SOAP note with Nova AI for user:', auth.sub);

    const soapNote = await generateSOAPWithNova(transcript, patientInfo || '');

    if (sessionId) {
      try {
        await updateSession(sessionId, {
          soapNote: {
            subjective: soapNote.subjective || '',
            objective: soapNote.objective || '',
            assessment: soapNote.assessment || '',
            plan: soapNote.plan || '',
            generatedAt: Date.now(),
          },
          transcript,
          status: 'completed',
        });
      } catch (dbError) {
        console.error('[SOAP] Error updating session in DB:', dbError);
        // SOAP note still returned to client even if DB update fails
      }
    }

    return NextResponse.json({ success: true, soapNote, sessionId });
  } catch (error) {
    console.error('[SOAP] Error generating SOAP note:', error);
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
        error: 'Failed to generate SOAP note',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
