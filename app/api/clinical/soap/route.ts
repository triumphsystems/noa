import { NextRequest } from 'next/server';
import { generateSOAPWithNova } from '@/lib/bedrock-nova';
import { updateSession } from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';
import { soapGenerateSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, zodValidationError } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, undefined, {
      prefix: 'soap',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = soapGenerateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(parseResult.error, 'Transcript is required');
    }

    const { transcript, patientInfo, sessionId } = parseResult.data;

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
