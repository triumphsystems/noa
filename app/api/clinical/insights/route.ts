import { NextRequest } from 'next/server';
import { generateClinicalInsights, generateFollowUpPlan } from '@/lib/bedrock';
import { requireAuth } from '@/lib/auth/guard';
import { insightsGenerateSchema } from '@/lib/validations';
import {
  apiSuccess,
  handleApiError,
  zodValidationError,
} from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, undefined, {
      prefix: 'insights',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = insightsGenerateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(
        parseResult.error,
        'Current presentation is required'
      );
    }

    const {
      patientHistory,
      currentPresentation,
      previousFindings,
      medications,
      procedures,
    } = parseResult.data;

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
      const proceduresList = procedures
        ? Array.isArray(procedures)
          ? procedures
          : [procedures]
        : undefined;
      followUpPlan = await generateFollowUpPlan(
        currentPresentation,
        medications || [],
        proceduresList
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
