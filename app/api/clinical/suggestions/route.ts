import { NextRequest } from 'next/server';
import { getClinicaSuggestions } from '@/lib/voice-service';
import { requireAuth } from '@/lib/auth/guard';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

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
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'Transcript is required',
        400
      );
    }

    // Generate suggestions using Nova Sonic
    const suggestions = await getClinicaSuggestions(
      transcript,
      patientHistory || '',
      currentSymptoms || transcript
    );

    return apiSuccess({
      suggestions,
      sessionId,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to generate suggestions');
  }
}
