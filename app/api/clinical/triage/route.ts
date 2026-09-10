import { NextRequest } from 'next/server';
import { generateTriagePriority } from '@/lib/bedrock';
import { requireAuth } from '@/lib/auth/guard';
import { triageGenerateSchema } from '@/lib/validations';
import {
  apiSuccess,
  handleApiError,
  zodValidationError,
} from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, undefined, {
      prefix: 'triage',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = triageGenerateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(
        parseResult.error,
        'Chief complaint and symptoms are required'
      );
    }

    const { chiefComplaint, symptoms, vitalSigns } = parseResult.data;

    const formattedSymptoms = Array.isArray(symptoms)
      ? symptoms.join(', ')
      : String(symptoms);

    const formattedVitalSigns = vitalSigns
      ? typeof vitalSigns === 'string'
        ? vitalSigns
        : JSON.stringify(vitalSigns)
      : undefined;

    // Generate triage priority using Nova Lite
    const triageResult = await generateTriagePriority(
      chiefComplaint,
      formattedSymptoms,
      formattedVitalSigns
    );

    return apiSuccess({ triage: triageResult });
  } catch (error) {
    return handleApiError(error, 'Failed to generate triage');
  }
}
