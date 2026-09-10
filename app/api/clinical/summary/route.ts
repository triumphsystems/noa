import { NextRequest } from 'next/server';
import { generatePatientSummary } from '@/lib/bedrock-nova';
import { requireAuth } from '@/lib/auth/guard';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

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
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'SOAP note is required',
        400
      );
    }

    // Generate patient-friendly summary using Nova Lite
    const summary = await generatePatientSummary(soapNote, clinicalTerms);

    return apiSuccess({ summary });
  } catch (error) {
    return handleApiError(error, 'Failed to generate patient summary');
  }
}
