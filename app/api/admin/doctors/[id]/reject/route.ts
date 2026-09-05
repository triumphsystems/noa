import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/jwt'
import { getDoctorById, updateDoctorVerification } from '@/lib/db'
import { removeUserFromCognitoGroup } from '@/lib/auth/cognito'
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/ratelimit'

/**
 * POST /api/admin/doctors/[id]/reject
 * Rejects a doctor application with a specified reason and revokes clinical privileges.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const rateCheck = await checkRateLimit(`admin:action:${clientId}`, { limit: 20, windowSeconds: 60 })
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck)
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const reason = body?.reason || 'Medical credentials could not be verified with the issuing authority.'

    const doctor = await getDoctorById(id)
    if (!doctor) {
      return NextResponse.json({ message: 'Doctor not found.' }, { status: 404 })
    }

    // 1. Update verification state in DynamoDB
    const adminId = auth.sub || 'admin'
    const updated = await updateDoctorVerification(id, 'rejected', adminId, reason)

    // 2. Remove clinician from Cognito "Doctors" group if previously present
    try {
      await removeUserFromCognitoGroup(doctor.email, 'Doctors')
    } catch {
      // Ignore if user was not in group
    }

    return NextResponse.json({
      success: true,
      message: `Doctor application for ${doctor.name} (${doctor.email}) has been marked as rejected.`,
      doctor: updated,
    })
  } catch (error: any) {
    console.error('[Admin API] Error rejecting doctor:', error?.message)
    return NextResponse.json(
      { message: error?.message || 'Failed to reject doctor' },
      { status: 500 }
    )
  }
}
