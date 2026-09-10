import { NextRequest, NextResponse } from 'next/server';
import { generateSOAPWithNova } from '@/lib/bedrock-nova';
import { updateSession } from '@/lib/db';
import { ClinicalAIUnavailableError } from '@/lib/ai/provider';
import { requireAuth } from '@/lib/auth/guard';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, undefined, {
      prefix: 'soap',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const body = await request.json();
    const { transcript, patientInfo, sessionId } = body;

    if (!transcript) {
      return NextResponse.json(
        { message: 'Transcript is required' },
        { status: 400 }
      );
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
            : 'Failed to generate SOAP note',
      },
      { status: 500 }
    );
  }
}
