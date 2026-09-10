import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { getDoctorById, updateDoctorVerification } from '@/lib/db';
import { addUserToCognitoGroup } from '@/lib/auth/cognito';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

/**
 * POST /api/admin/doctors/[id]/approve
 * Approves a pending doctor account, sets verificationStatus: 'verified',
 * and adds the clinician to Cognito's 'Doctors' group.
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
    const doctor = await getDoctorById(id);

    if (!doctor) {
      return apiError(API_ERROR_CODES.NOT_FOUND, 'Doctor not found.', 404);
    }

    // 1. Update verification state in DynamoDB
    const adminId = auth.sub || 'admin';
    const updated = await updateDoctorVerification(id, 'verified', adminId);

    // 2. Add clinician to Cognito "Doctors" group so Cognito JWT contains group membership
    try {
      await addUserToCognitoGroup(doctor.email, 'Doctors');
    } catch (cognitoError) {
      const msg =
        cognitoError instanceof Error ? cognitoError.message : 'Unknown error';
      console.warn('[Admin API] Cognito group assignment warning:', msg);
      // Group assignment failure shouldn't fail the verification DB record if group already assigned
    }

    return apiSuccess({
      message: `Doctor ${doctor.name} (${doctor.email}) has been successfully verified.`,
      doctor: updated,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to approve doctor');
  }
}
