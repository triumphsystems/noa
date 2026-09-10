import { NextRequest, NextResponse } from 'next/server';

import type { ApiSuccess } from '@/lib/types/api.types';
import type { DoctorDashboardPayload } from '@/lib/types/doctor.types';
import { getDoctorById } from '@/lib/db';
import { getDoctorData } from '@/lib/data/doctor';
import { requireAuth } from '@/lib/auth/guard';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuth(request, ['doctor', 'admin']);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    // Canonical doctor ID is the Cognito Auth ID
    const requestedDoctorId = request.nextUrl.searchParams.get('doctorId');
    const canonicalDoctorId = auth.sub;

    let doctorId = canonicalDoctorId;
    if (auth.userType === 'admin' && requestedDoctorId) {
      doctorId = requestedDoctorId;
    }

    if (
      auth.userType === 'doctor' &&
      requestedDoctorId &&
      requestedDoctorId !== canonicalDoctorId
    ) {
      return NextResponse.json(
        { message: 'Forbidden: Cannot access another doctor dashboard' },
        { status: 403 }
      );
    }

    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      return NextResponse.json(
        { message: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Enforce credential verification: pending or rejected accounts cannot access clinical dashboard
    if (doctor.verificationStatus === 'pending') {
      return NextResponse.json(
        {
          message:
            'Your medical credentials are currently under review by clinical administration.',
          verificationStatus: 'pending',
          doctor,
        },
        { status: 403 }
      );
    }

    if (doctor.verificationStatus === 'rejected') {
      return NextResponse.json(
        {
          message: 'Your medical verification request was rejected.',
          verificationStatus: 'rejected',
          rejectionReason: doctor.rejectionReason,
          doctor,
        },
        { status: 403 }
      );
    }

    const dashboard = await getDoctorData(doctorId);
    if (!dashboard) {
      return NextResponse.json(
        { message: 'Doctor dashboard data not found' },
        { status: 404 }
      );
    }

    const response: ApiSuccess<DoctorDashboardPayload> = {
      success: true,
      data: dashboard,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Dashboard/Doctor] Error loading doctor dashboard:', error);
    return NextResponse.json(
      {
        message: 'Failed to load doctor dashboard',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
