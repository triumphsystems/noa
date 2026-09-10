import { NextRequest, NextResponse } from 'next/server';
import {
  getPatientById,
  getIntakesByPatient,
  updatePatient,
  type Patient,
} from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(request);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

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

    // Admins can access any patient record and their intake history
    if (auth.userType === 'admin') {
      const intakes = await getIntakesByPatient(id);
      return NextResponse.json({
        success: true,
        patient,
        intake: intakes[0] || null,
        intakes,
      });
    }

    // Patients can only access their own record and intakes
    if (auth.userType === 'patient') {
      if (id !== auth.sub) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot access another patient record' },
          { status: 403 }
        );
      }
      const intakes = await getIntakesByPatient(id);
      return NextResponse.json({
        success: true,
        patient,
        intake: intakes[0] || null,
        intakes,
      });
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

      // If pending approval only, redact sensitive medical records and omit intake
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
        return NextResponse.json({
          success: true,
          patient: sanitized,
          intake: null,
        });
      }

      // Doctor has consent and active link — fetch clinical intake notes
      const intakes = await getIntakesByPatient(id);
      return NextResponse.json({
        success: true,
        patient,
        intake: intakes[0] || null,
        intakes,
      });
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(request);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Only the patient themselves or an admin can update patient profile attributes
    const isOwner = auth.userType === 'patient' && auth.sub === id;
    const isAdmin = auth.userType === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot modify this profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedUpdates: Partial<Patient> = {};

    if (body.avatar !== undefined) allowedUpdates.avatar = body.avatar;
    if (body.phone !== undefined) allowedUpdates.phone = body.phone;
    if (body.gender !== undefined) allowedUpdates.gender = body.gender;
    if (body.dateOfBirth !== undefined)
      allowedUpdates.dateOfBirth = body.dateOfBirth;
    if (body.address !== undefined) allowedUpdates.address = body.address;
    if (Array.isArray(body.allergies))
      allowedUpdates.allergies = body.allergies;
    if (Array.isArray(body.medications))
      allowedUpdates.medications = body.medications;
    if (Array.isArray(body.conditions))
      allowedUpdates.conditions = body.conditions;

    const updated = await updatePatient(id, allowedUpdates);
    if (!updated) {
      return NextResponse.json(
        { error: 'Patient not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, patient: updated });
  } catch (error) {
    console.error('[Patients] Error updating patient:', error);
    return NextResponse.json(
      {
        error: 'Failed to update patient profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
