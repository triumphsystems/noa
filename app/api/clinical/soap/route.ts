import { NextRequest } from 'next/server';
import { generateSOAPWithNova } from '@/lib/bedrock-nova';
import { updateSession } from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

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
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'Transcript is required',
        400
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

    return apiSuccess({ soapNote, sessionId });
  } catch (error) {
    return handleApiError(error, 'Failed to generate SOAP note');
  }
}
