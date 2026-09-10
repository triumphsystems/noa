import { NextRequest } from 'next/server';
import {
  getPatientById,
  getDoctorById,
  getDoctorByCareCode,
  updatePatient,
  computeDoctorCareCode,
} from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';
import { doctorConnectSchema } from '@/lib/validations';
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

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = doctorConnectSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(
        parseResult.error,
        'Either doctorId or careCode is required'
      );
    }

    const { doctorId, careCode } = parseResult.data;

    // Resolve caller patient
    const patientId = auth.sub;
    if (!patientId) {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        'Missing patient identity in token',
        400
      );
    }

    const patient = await getPatientById(patientId);
    if (!patient) {
      return apiError(
        API_ERROR_CODES.NOT_FOUND,
        'Patient profile not found',
        404
      );
    }

    // Locate doctor
    let targetDoctor = null;
    if (careCode) {
      targetDoctor = await getDoctorByCareCode(careCode);
    } else if (doctorId) {
      targetDoctor = await getDoctorById(doctorId);
    }

    if (!targetDoctor) {
      return apiError(
        API_ERROR_CODES.NOT_FOUND,
        'Doctor not found with the provided code or ID',
        404
      );
    }

    // Connect patient to doctor:
    // When patient initiates via careCode or doctor selection, stage as pending doctor approval
    // to prevent unauthorized patient list injection and ensure clinician oversight.
    const updatedPatient = await updatePatient(patient.id, {
      pendingDoctorId: targetDoctor.id,
      linkStatus: 'pending_doctor_approval',
      linkRequestedBy: 'patient',
      linkRequestedAt: Date.now(),
    });

    return apiSuccess({
      patient: updatedPatient,
      doctor: {
        id: targetDoctor.id,
        name: targetDoctor.name,
        specialty: targetDoctor.specialty,
        clinic: targetDoctor.clinic,
        careCode: targetDoctor.careCode || computeDoctorCareCode(targetDoctor),
        email: targetDoctor.email,
      },
      message: `Connection request submitted to Dr. ${targetDoctor.name}. Your care relationship will be active once reviewed by the clinician.`,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to connect to doctor');
  }
}
