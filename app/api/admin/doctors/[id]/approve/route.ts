import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { getDoctorById, updateDoctorVerification } from '@/lib/db';
import { addUserToCognitoGroup } from '@/lib/auth/cognito';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from '@/lib/ratelimit';

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
    const auth = await getAuthenticatedUser(request);
    if (!auth.isValid) {
      return NextResponse.json(
        { message: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const isAdmin =
      auth.userType === 'admin' ||
      (auth.groups &&
        auth.groups.some((g) =>
          ['Admins', 'Superadmins', 'admins', 'superadmins'].includes(g)
        ));

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      );
    }

    const clientId = getClientIdentifier(request, auth.sub || auth.email);
    const rateCheck = await checkRateLimit(`admin:action:${clientId}`, {
      limit: 20,
      windowSeconds: 60,
    });
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

    const { id } = await params;
    const doctor = await getDoctorById(id);

    if (!doctor) {
      return NextResponse.json(
        { message: 'Doctor not found.' },
        { status: 404 }
      );
    }

    // 1. Update verification state in DynamoDB
    const adminId = auth.sub || 'admin';
    const updated = await updateDoctorVerification(id, 'verified', adminId);

    // 2. Add clinician to Cognito "Doctors" group so Cognito JWT contains group membership
    try {
      await addUserToCognitoGroup(doctor.email, 'Doctors');
    } catch (cognitoError: any) {
      console.warn(
        '[Admin API] Cognito group assignment warning:',
        cognitoError?.message
      );
      // Group assignment failure shouldn't fail the verification DB record if group already assigned
    }

    return NextResponse.json({
      success: true,
      message: `Doctor ${doctor.name} (${doctor.email}) has been successfully verified.`,
      doctor: updated,
    });
  } catch (error: any) {
    console.error('[Admin API] Error approving doctor:', error?.message);
    return NextResponse.json(
      { message: error?.message || 'Failed to approve doctor' },
      { status: 500 }
    );
  }
}
