import { NextRequest } from 'next/server';
import {
  getPatientById,
  getIntakesByPatient,
  updatePatient,
  type Patient,
} from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';
import { patientProfileUpdateSchema } from '@/lib/validations';
import { apiError, apiSuccess, handleApiError, zodValidationError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

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
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'Patient ID is required',
        400
      );
    }

    const patient = await getPatientById(id);

    if (!patient) {
      return apiError(
        API_ERROR_CODES.NOT_FOUND,
        'Patient not found',
        404
      );
    }

    // -----------------------------------------------------------------------
    // BOLA Authorization — explicit allowlist approach
    // -----------------------------------------------------------------------

    // Admins can access any patient record and their intake history
    if (auth.userType === 'admin') {
      const intakes = await getIntakesByPatient(id);
      return apiSuccess({
        patient,
        intake: intakes[0] || null,
        intakes,
      });
    }

    // Patients can only access their own record and intakes
    if (auth.userType === 'patient') {
      if (id !== auth.sub) {
        return apiError(
          API_ERROR_CODES.FORBIDDEN,
          'Forbidden: Cannot access another patient record',
          403
        );
      }
      const intakes = await getIntakesByPatient(id);
      return apiSuccess({
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
        return apiError(
          API_ERROR_CODES.FORBIDDEN,
          'Forbidden: You do not have an active care relationship with this patient',
          403
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
        return apiSuccess({
          patient: sanitized,
          intake: null,
        });
      }

      // Doctor has consent and active link — fetch clinical intake notes
      const intakes = await getIntakesByPatient(id);
      return apiSuccess({
        patient,
        intake: intakes[0] || null,
        intakes,
      });
    }

    // Unknown role — deny
    return apiError(API_ERROR_CODES.FORBIDDEN, 'Forbidden', 403);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch patient');
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
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'Patient ID is required',
        400
      );
    }

    // Only the patient themselves or an admin can update patient profile attributes
    const isOwner = auth.userType === 'patient' && auth.sub === id;
    const isAdmin = auth.userType === 'admin';
    if (!isOwner && !isAdmin) {
      return apiError(
        API_ERROR_CODES.FORBIDDEN,
        'Forbidden: Cannot modify this profile',
        403
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = patientProfileUpdateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(parseResult.error, 'At least one field is required for update');
    }

    const body = parseResult.data;
    const allowedUpdates: Partial<Patient> = {};

    if (body.avatar !== undefined) allowedUpdates.avatar = body.avatar;
    if (body.phone !== undefined) allowedUpdates.phone = body.phone;
    if (body.gender !== undefined) allowedUpdates.gender = body.gender;
    if (body.dateOfBirth !== undefined)
      allowedUpdates.dateOfBirth = body.dateOfBirth;
    if (body.address !== undefined) allowedUpdates.address = body.address;
    if (body.allergies !== undefined)
      allowedUpdates.allergies = body.allergies;
    if (body.medications !== undefined)
      allowedUpdates.medications = body.medications;
    if (body.conditions !== undefined)
      allowedUpdates.conditions = body.conditions;

    const updated = await updatePatient(id, allowedUpdates);
    if (!updated) {
      return apiError(
        API_ERROR_CODES.NOT_FOUND,
        'Patient not found or update failed',
        404
      );
    }

    return apiSuccess({ patient: updated });
  } catch (error) {
    return handleApiError(error, 'Failed to update patient profile');
  }
}
