import { NextRequest } from 'next/server';
import { getPatientById, getDoctorById, updatePatient } from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';
import { patientLinkActionSchema } from '@/lib/validations';
import {
  apiError,
  apiSuccess,
  handleApiError,
  zodValidationError,
} from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, ['patient']);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const patientId = auth.sub;

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = patientLinkActionSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(
        parseResult.error,
        'Valid action (accept or decline) is required'
      );
    }

    const { action } = parseResult.data;

    const patient = await getPatientById(patientId);
    if (!patient) {
      return apiError(
        API_ERROR_CODES.NOT_FOUND,
        'Patient profile not found',
        404
      );
    }

    if (
      patient.linkStatus !== 'pending_patient_approval' ||
      !patient.pendingDoctorId
    ) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'No pending doctor connection request found.',
        400
      );
    }

    const doctor = await getDoctorById(patient.pendingDoctorId);

    if (action === 'accept') {
      const updatedPatient = await updatePatient(patient.id, {
        doctorId: patient.pendingDoctorId,
        pendingDoctorId: null as unknown as string,
        linkStatus: 'linked',
        linkRequestedAt: Date.now(),
      });

      return apiSuccess({
        patient: updatedPatient,
        doctor,
        message: doctor
          ? `You are now securely connected with Dr. ${doctor.name}.`
          : 'Doctor connection approved.',
      });
    } else {
      // Decline
      const updatedPatient = await updatePatient(patient.id, {
        pendingDoctorId: null as unknown as string,
        linkStatus: 'unlinked',
      });

      return apiSuccess({
        patient: updatedPatient,
        doctor: null,
        message: 'Doctor invitation declined.',
      });
    }
  } catch (error) {
    return handleApiError(error, 'Failed to process connection response');
  }
}
