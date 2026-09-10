import { NextRequest } from 'next/server';
import { getPatientById, getDoctorById, updatePatient } from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';
import { doctorLinkActionSchema } from '@/lib/validations';
import { apiError, apiSuccess, handleApiError, zodValidationError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

/**
 * POST /api/doctors/link
 * Allows a doctor to accept or decline a connection request initiated by a patient.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, ['doctor']);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const doctorId = auth.sub;

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = doctorLinkActionSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(parseResult.error, 'Invalid link action request');
    }

    const { patientId, action } = parseResult.data;

    const patient = await getPatientById(patientId);
    if (!patient) {
      return apiError(
        API_ERROR_CODES.NOT_FOUND,
        'Patient profile not found',
        404
      );
    }

    // Verify that the patient has a pending request specifically targeting this doctor
    if (
      patient.linkStatus !== 'pending_doctor_approval' ||
      patient.pendingDoctorId !== doctorId
    ) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'No pending connection request from this patient found for your account.',
        400
      );
    }

    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      return apiError(
        API_ERROR_CODES.NOT_FOUND,
        'Doctor profile not found',
        404
      );
    }

    if (doctor.verificationStatus !== 'verified') {
      return apiError(
        API_ERROR_CODES.ACCOUNT_UNVERIFIED,
        'Your medical credentials must be verified by clinical administration before connecting with patients.',
        403
      );
    }

    if (action === 'accept') {
      const updatedPatient = await updatePatient(patient.id, {
        doctorId: doctorId,
        pendingDoctorId: null as unknown as string,
        linkStatus: 'linked',
        linkRequestedAt: Date.now(),
      });

      return apiSuccess({
        patient: updatedPatient,
        doctor,
        message: `Patient ${patient.firstName} ${patient.lastName} has been approved and linked to your practice.`,
      });
    } else {
      // Decline connection request
      const updatedPatient = await updatePatient(patient.id, {
        pendingDoctorId: null as unknown as string,
        linkStatus: 'unlinked',
      });

      return apiSuccess({
        patient: updatedPatient,
        message: 'Patient connection request declined.',
      });
    }
  } catch (error) {
    return handleApiError(error, 'Failed to process connection request');
  }
}
