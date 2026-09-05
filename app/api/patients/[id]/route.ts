import { NextRequest, NextResponse } from 'next/server';
import { getPatientById } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const patient = await getPatientById(id);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // -----------------------------------------------------------------------
    // BOLA Authorization — explicit allowlist approach
    // -----------------------------------------------------------------------

    // Admins can access any patient record
    if (auth.userType === 'admin') {
      return NextResponse.json({ success: true, patient });
    }

    // Patients can only access their own record
    if (auth.userType === 'patient') {
      if (id !== auth.sub) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot access another patient record' },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true, patient });
    }

    // Doctors: explicit allowlist — must be actively linked OR pending approval
    if (auth.userType === 'doctor') {
      const isLinkedToDoctor =
        patient.doctorId === auth.sub && patient.linkStatus === 'linked';
      const isPendingDoctor = patient.pendingDoctorId === auth.sub;

      // Deny unless the doctor has an explicit link relationship with this patient
      if (!isLinkedToDoctor && !isPendingDoctor) {
        return NextResponse.json(
          {
            error:
              'Forbidden: You do not have an active care relationship with this patient',
          },
          { status: 403 }
        );
      }

      // If pending approval only, redact sensitive medical records
      if (!isLinkedToDoctor) {
        const sanitized = {
          id: patient.id,
          email: patient.email,
          firstName: patient.firstName,
          lastName: patient.lastName,
          linkStatus: patient.linkStatus,
          linkRequestedAt: patient.linkRequestedAt,
          phone: patient.phone ? `${patient.phone.slice(0, 3)}***` : undefined,
          allergies: [] as string[],
          medications: [] as string[],
          conditions: [] as string[],
        };
        return NextResponse.json({ success: true, patient: sanitized });
      }

      return NextResponse.json({ success: true, patient });
    }

    // Unknown role — deny
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('[Patients] Error fetching patient:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch patient',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
