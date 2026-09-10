import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { getDoctorById, updateDoctorVerification } from '@/lib/db';
import { removeUserFromCognitoGroup } from '@/lib/auth/cognito';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

/**
 * POST /api/admin/doctors/[id]/reject
 * Rejects a doctor application with a specified reason and revokes clinical privileges.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(request, ['admin'], {
      prefix: 'admin:action',
      limit: 20,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason =
      body?.reason ||
      'Medical credentials could not be verified with the issuing authority.';

    const doctor = await getDoctorById(id);
    if (!doctor) {
      return apiError(
        API_ERROR_CODES.NOT_FOUND,
        'Doctor not found.',
        404
      );
    }

    // 1. Update verification state in DynamoDB
    const adminId = auth.sub || 'admin';
    const updated = await updateDoctorVerification(
      id,
      'rejected',
      adminId,
      reason
    );

    // 2. Remove clinician from Cognito "Doctors" group if previously present
    try {
      await removeUserFromCognitoGroup(doctor.email, 'Doctors');
    } catch {
      // Ignore if user was not in group
    }

    return apiSuccess({
      message: `Doctor application for ${doctor.name} (${doctor.email}) has been marked as rejected.`,
      doctor: updated,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to reject doctor');
  }
}
