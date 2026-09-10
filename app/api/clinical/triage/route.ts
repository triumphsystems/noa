import { NextRequest } from 'next/server';
import { generateTriagePriority } from '@/lib/bedrock-nova';
import { requireAuth } from '@/lib/auth/guard';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, undefined, {
      prefix: 'triage',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const body = await request.json();
    const { chiefComplaint, symptoms, vitalSigns } = body;

    if (!chiefComplaint || !symptoms) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'Chief complaint and symptoms are required',
        400
      );
    }

    // Generate triage priority using Nova Lite
    const triageResult = await generateTriagePriority(
      chiefComplaint,
      symptoms,
      vitalSigns
    );

    return apiSuccess({ triage: triageResult });
  } catch (error) {
    return handleApiError(error, 'Failed to generate triage');
  }
}
