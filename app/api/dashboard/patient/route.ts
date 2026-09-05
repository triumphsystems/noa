import { NextRequest, NextResponse } from 'next/server';
import type { ApiSuccess } from '@/lib/types/api.types';
import type { PatientDashboardPayload } from '@/lib/types/patient.types';
import {
  getPatientById,
  getDoctorById,
  getSessionsByPatient,
  getIntakeById,
  getIntakesByPatient,
} from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.isValid || !auth.sub) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const requestedPatientId = request.nextUrl.searchParams.get('patientId');
    const canonicalPatientId = auth.sub;

    let patientId =
      requestedPatientId ||
      (auth.userType === 'patient' ? canonicalPatientId : null);

    if (!patientId) {
      return NextResponse.json(
        { message: 'patientId is required' },
        { status: 400 }
      );
    }

    if (auth.userType === 'patient' && patientId !== canonicalPatientId) {
      return NextResponse.json(
        { message: 'Forbidden: Cannot access another patient dashboard' },
        { status: 403 }
      );
    }

    const patient = await getPatientById(patientId);
    if (!patient) {
      return NextResponse.json(
        { message: 'Patient not found' },
        { status: 404 }
      );
    }

    if (auth.userType === 'doctor') {
      const isLinked = patient.doctorId === auth.sub;
      const isPending = patient.pendingDoctorId === auth.sub;
      if (!isLinked && !isPending) {
        return NextResponse.json(
          {
            message:
              'Forbidden: Cannot access a patient not linked to your clinic',
          },
          { status: 403 }
        );
      }
    }

    const [doctor, pendingDoctor, sessions, intakes] = await Promise.all([
      patient.doctorId
        ? getDoctorById(patient.doctorId)
        : Promise.resolve(null),
      patient.pendingDoctorId
        ? getDoctorById(patient.pendingDoctorId)
        : Promise.resolve(null),
      getSessionsByPatient(patientId),
      getIntakesByPatient(patientId),
    ]);

    const sortedSessions = [...sessions].sort(
      (a, b) => (b.startedAt || 0) - (a.startedAt || 0)
    );
    const latestIntake = intakes[0] || null;

    const stats = {
      totalConsultations: sessions.length,
      completedConsultations: sessions.filter((s) => s.status === 'completed')
        .length,
      activeConsultations: sessions.filter((s) => s.status === 'active').length,
      hasIntake: Boolean(latestIntake),
    };

    const payload: PatientDashboardPayload = {
      patient,
      doctor,
      pendingDoctor,
      sessions: sortedSessions,
      intake: latestIntake,
      stats,
    };

    const response: ApiSuccess<PatientDashboardPayload> = {
      success: true,
      data: payload,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Patient Dashboard] Error loading data:', error);
    return NextResponse.json(
      {
        message: 'Failed to load patient dashboard',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
