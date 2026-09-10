import { NextRequest } from 'next/server';
import { generatePatientSummary } from '@/lib/bedrock-nova';
import { requireAuth } from '@/lib/auth/guard';
import { summaryGenerateSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, zodValidationError } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, undefined, {
      prefix: 'summary',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = summaryGenerateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(parseResult.error, 'SOAP note is required');
    }

    const { soapNote, clinicalTerms } = parseResult.data;

    // Generate patient-friendly summary using Nova Lite
    const summary = await generatePatientSummary(soapNote, clinicalTerms);

    return apiSuccess({ summary });
  } catch (error) {
    return handleApiError(error, 'Failed to generate patient summary');
  }
}
