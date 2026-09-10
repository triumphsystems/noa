import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { apiSuccess, handleApiError } from '@/lib/api/response';
import {
  getDoctorsByVerificationStatus,
  getAllDoctors,
  DoctorVerificationStatus,
} from '@/lib/db';

/**
 * GET /api/admin/doctors
 * Returns doctors filtered by verificationStatus (pending, verified, rejected) or all doctors.
 * Strictly restricted to verified Administrators.
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuth(request, ['admin'], {
      prefix: 'admin:list',
      limit: 30,
      windowSeconds: 60,
    });
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const statusParam = request.nextUrl.searchParams.get(
      'status'
    ) as DoctorVerificationStatus | null;

    const allDoctors = await getAllDoctors();
    const counts = {
      pending: allDoctors.filter(
        (d) => (d.verificationStatus || 'pending') === 'pending'
      ).length,
      verified: allDoctors.filter((d) => d.verificationStatus === 'verified')
        .length,
      rejected: allDoctors.filter((d) => d.verificationStatus === 'rejected')
        .length,
      total: allDoctors.length,
    };

    const doctors =
      statusParam && ['pending', 'verified', 'rejected'].includes(statusParam)
        ? allDoctors.filter(
            (d) => (d.verificationStatus || 'pending') === statusParam
          )
        : allDoctors;

    return apiSuccess({
      count: doctors.length,
      counts,
      doctors: doctors.map((doc) => ({
        id: doc.id,
        name: doc.name,
        email: doc.email,
        specialty: doc.specialty,
        license: doc.license,
        issuingAuthority: doc.issuingAuthority || null,
        licenseDocumentUrl: doc.licenseDocumentUrl || null,
        clinic: doc.clinic,
        careCode: doc.careCode,
        verificationStatus: doc.verificationStatus || 'pending',
        verifiedAt: doc.verifiedAt || null,
        verifiedBy: doc.verifiedBy || null,
        rejectionReason: doc.rejectionReason || null,
        phone: doc.phone || null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      total: allDoctors.length,
    });
  } catch (error) {
    return handleApiError(
      error,
      'Failed to retrieve clinicians registry. Please try again.'
    );
  }
}
