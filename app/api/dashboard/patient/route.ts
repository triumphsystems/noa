import { NextRequest, NextResponse } from 'next/server';
import type { ApiSuccess } from '@/lib/types/api.types';
import type { PatientDashboardPayload } from '@/lib/types/patient.types';
import { getPatientById } from '@/lib/db';
import { getPatientData } from '@/lib/data/patient';
import { requireAuth } from '@/lib/auth/guard';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuth(request);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

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

    const payload = await getPatientData(patientId);
    if (!payload) {
      return NextResponse.json(
        { message: 'Patient dashboard data not found' },
        { status: 404 }
      );
    }

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
