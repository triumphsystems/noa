import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import {
  getDoctorsByVerificationStatus,
  getAllDoctors,
  DoctorVerificationStatus,
} from '@/lib/db';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from '@/lib/ratelimit';

/**
 * GET /api/admin/doctors
 * Returns doctors filtered by verificationStatus (pending, verified, rejected) or all doctors.
 * Strictly restricted to verified Administrators.
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuth(request, ['admin']);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const clientId = getClientIdentifier(request, auth.sub || auth.email);
    const rateCheck = await checkRateLimit(`admin:list:${clientId}`, {
      limit: 30,
      windowSeconds: 60,
    });
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

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

    return NextResponse.json({
      success: true,
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
    });
  } catch (error: any) {
    console.error('[Admin API] Error listing doctors:', error?.message);
    return NextResponse.json(
      {
        message:
          'Failed to retrieve clinicians registry. Please check server logs or refresh.',
      },
      { status: 500 }
    );
  }
}
