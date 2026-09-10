import { NextRequest } from 'next/server';
import {
  generateClinicalInsights,
  generateFollowUpPlan,
} from '@/lib/bedrock-nova';
import { requireAuth } from '@/lib/auth/guard';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, undefined, {
      prefix: 'insights',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const body = await request.json();
    const {
      patientHistory,
      currentPresentation,
      previousFindings,
      medications,
      procedures,
    } = body;

    if (!currentPresentation) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'Current presentation is required',
        400
      );
    }

    console.log('[v0] Generating clinical insights with Nova');

    // Generate clinical insights using Nova Pro
    const insights = await generateClinicalInsights(
      patientHistory || '',
      currentPresentation,
      previousFindings || ''
    );

    // Generate follow-up plan if medications or procedures provided
    let followUpPlan = '';
    if (medications || procedures) {
      followUpPlan = await generateFollowUpPlan(
        currentPresentation,
        medications || [],
        procedures
      );
    }

    return apiSuccess({
      insights,
      followUpPlan,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to generate clinical insights');
  }
}
