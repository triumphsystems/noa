import { NextRequest, NextResponse } from 'next/server';

import type { ApiSuccess } from '@/lib/types/api.types';
import type { DoctorDashboardPayload } from '@/lib/types/doctor.types';
import {
  getDoctorById,
  getPatientsByDoctor,
  getPendingPatientsByDoctor,
  getSessionsByDoctor,
  computeDoctorCareCode,
  type Patient,
} from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.isValid || !auth.sub) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (
      auth.userType &&
      auth.userType !== 'doctor' &&
      auth.userType !== 'admin'
    ) {
      return NextResponse.json(
        { message: 'Forbidden: Doctor role required' },
        { status: 403 }
      );
    }

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

    const [linkedPatients, pendingPatients, sessions] = await Promise.all([
      getPatientsByDoctor(doctorId),
      getPendingPatientsByDoctor(doctorId),
      getSessionsByDoctor(doctorId),
    ]);

    // Combine linked and pending patients.
    // Redact sensitive clinical data for patients who have not explicitly accepted the link!
    const patientMap = new Map<string, Patient>();
    linkedPatients.forEach((p) => patientMap.set(p.id, p));
    pendingPatients.forEach((p) => {
      if (!patientMap.has(p.id)) {
        const isFullyLinked =
          p.linkStatus === 'linked' && p.doctorId === doctorId;
        const sanitized: Patient = isFullyLinked
          ? p
          : {
              ...p,
              dateOfBirth: undefined,
              gender: undefined,
              phone: p.phone ? `${p.phone.slice(0, 3)}***` : undefined,
              address: undefined,
              allergies: [],
              medications: [],
              conditions: [],
            };
        patientMap.set(p.id, sanitized);
      }
    });
    const patients = Array.from(patientMap.values());

    const today = new Date();
    const stats = {
      totalPatients: patients.length,
      totalSessions: sessions.length,
      completedSessions: sessions.filter(
        (session) => session.status === 'completed'
      ).length,
      activeSessions: sessions.filter((session) => session.status === 'active')
        .length,
      pendingNotes: sessions.filter(
        (session) => session.status === 'active' && !session.soapNote
      ).length,
      todaySessions: sessions.filter(
        (session) =>
          new Date(session.startedAt).toDateString() === today.toDateString()
      ).length,
    };

    // Use canonical computeDoctorCareCode — no inline duplication
    const doctorWithCareCode = {
      ...doctor,
      careCode: computeDoctorCareCode(doctor),
    };

    const dashboard: DoctorDashboardPayload = {
      doctor: doctorWithCareCode,
      patients,
      sessions: [...sessions].sort((a, b) => b.startedAt - a.startedAt),
      stats,
    };

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
