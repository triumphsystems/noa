import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { getDoctorById, getPatientById } from '@/lib/db';

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's identity.
 * Used by AuthContext on mount to verify the server-side session and hydrate the client.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.isValid || !auth.sub) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    let name = '';
    let email = auth.email || '';
    let avatar: string | undefined = undefined;

    // Fetch canonical display name and avatar from DynamoDB profile
    try {
      if (auth.userType === 'doctor') {
        const doctor = await getDoctorById(auth.sub);
        if (doctor) {
          name = doctor.name || '';
          email = doctor.email || email;
          avatar = doctor.avatar;
        }
      } else if (auth.userType === 'patient') {
        const patient = await getPatientById(auth.sub);
        if (patient) {
          name = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
          email = patient.email || email;
          avatar = patient.avatar;
        }
      }
    } catch {
      // Profile lookup failure is non-fatal — return auth-only identity
    }

    return NextResponse.json({
      user: {
        id: auth.sub,
        email,
        name,
        userType: auth.userType,
        avatar: avatar || null,
      },
    });
  } catch (error) {
    console.error('[Auth/Me] Error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
