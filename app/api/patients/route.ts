import { NextRequest, NextResponse } from 'next/server';
import { getPatientsByDoctor, isDoctorVerified } from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuth(request);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const requestedDoctorId = request.nextUrl.searchParams.get('doctorId');
    const doctorId =
      auth.userType === 'admin' && requestedDoctorId
        ? requestedDoctorId
        : auth.sub;

    if (auth.userType === 'doctor') {
      if (requestedDoctorId && requestedDoctorId !== auth.sub) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot list patients for another doctor' },
          { status: 403 }
        );
      }

      const verified = await isDoctorVerified(auth.sub);
      if (!verified) {
        return NextResponse.json(
          { error: 'Forbidden: Medical license verification is pending.' },
          { status: 403 }
        );
      }
    }

    const patients = await getPatientsByDoctor(doctorId);

    return NextResponse.json({
      success: true,
      patients,
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch patients',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
