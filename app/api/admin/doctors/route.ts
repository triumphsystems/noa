import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/jwt'
import { getDoctorsByVerificationStatus, getAllDoctors, DoctorVerificationStatus } from '@/lib/db'
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/ratelimit'

/**
 * GET /api/admin/doctors
 * Returns doctors filtered by verificationStatus (pending, verified, rejected) or all doctors.
 * Strictly restricted to verified Administrators.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ message: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const isAdmin =
      auth.userType === 'admin' ||
      (auth.groups && auth.groups.some(g => ['Admins', 'Superadmins', 'admins', 'superadmins'].includes(g)))

    if (!isAdmin) {
      return NextResponse.json({ message: 'Forbidden: Administrator privileges required.' }, { status: 403 })
    }

    const clientId = getClientIdentifier(request, auth.sub || auth.email)
    const rateCheck = await checkRateLimit(`admin:list:${clientId}`, { limit: 30, windowSeconds: 60 })
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck)
    }

    const statusParam = request.nextUrl.searchParams.get('status') as DoctorVerificationStatus | null

    let doctors = []
    if (statusParam && ['pending', 'verified', 'rejected'].includes(statusParam)) {
      doctors = await getDoctorsByVerificationStatus(statusParam)
    } else {
      doctors = await getAllDoctors()
    }

    return NextResponse.json({
      success: true,
      count: doctors.length,
      doctors: doctors.map(doc => ({
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
    })
  } catch (error: any) {
    console.error('[Admin API] Error listing doctors:', error?.message)
    return NextResponse.json(
      { message: error?.message || 'Failed to list doctors' },
      { status: 500 }
    )
  }
}
