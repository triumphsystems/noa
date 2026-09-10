import { NextRequest } from 'next/server';
import { createIntake, getIntakesByPatient } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { requireAuth } from '@/lib/auth/guard';
import { intakeSubmitSchema } from '@/lib/validations';
import { apiError, apiSuccess, handleApiError, zodValidationError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = intakeSubmitSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(parseResult.error, 'Intake submission validation failed');
    }

    const {
      patientId: requestedPatientId,
      doctorId,
      chiefComplaint,
      summary,
      medicalHistory,
      medications,
      allergies,
      surgeries,
      familyHistory,
      socialHistory,
    } = parseResult.data;

    const patientId =
      auth.isValid && auth.userType === 'patient' && auth.sub
        ? auth.sub
        : requestedPatientId ||
          `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (
      auth.isValid &&
      auth.userType === 'patient' &&
      requestedPatientId &&
      requestedPatientId !== auth.sub
    ) {
      return apiError(
        API_ERROR_CODES.FORBIDDEN,
        'Forbidden: Cannot submit intake for another patient',
        403
      );
    }

    // Create intake in DynamoDB
    const intake = await createIntake({
      patientId,
      doctorId,
      chiefComplaint: chiefComplaint || summary || '',
      summary: summary || chiefComplaint || '',
      medicalHistory: medicalHistory || '',
      medications: medications || [],
      allergies: allergies || [],
      surgeries: surgeries || '',
      familyHistory: familyHistory || '',
      socialHistory: socialHistory || '',
      completed: true,
      completedAt: Date.now(),
    });

    return apiSuccess({
      intake,
      message: 'Intake form submitted successfully',
    });
  } catch (error) {
    return handleApiError(error, 'Failed to submit intake form');
  }
}

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuth(request);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const patientId = request.nextUrl.searchParams.get('patientId');

    if (!patientId) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'patientId is required',
        400
      );
    }

    if (auth.userType === 'patient' && patientId !== auth.sub) {
      return apiError(
        API_ERROR_CODES.FORBIDDEN,
        'Forbidden: Cannot view another patient intake',
        403
      );
    }

    const intakes = await getIntakesByPatient(patientId);

    return apiSuccess({ intakes });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch intakes');
  }
}
