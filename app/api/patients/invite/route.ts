import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import {
  getDoctorById,
  getPatientByEmail,
  createPatient,
  updatePatient,
} from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';
import { patientInviteSchema } from '@/lib/validations';
import { apiError, apiSuccess, handleApiError, zodValidationError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAuth(request, ['doctor']);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const doctorId = auth.sub;

    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      return apiError(
        API_ERROR_CODES.NOT_FOUND,
        'Doctor record not found',
        404
      );
    }

    if (doctor.verificationStatus !== 'verified') {
      return apiError(
        API_ERROR_CODES.ACCOUNT_UNVERIFIED,
        'Your medical credentials must be verified by clinical administration before inviting patients.',
        403
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = patientInviteSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return zodValidationError(parseResult.error, 'Patient email is required');
    }

    const { email, firstName, lastName, phone } = parseResult.data;

    const cleanEmail = email.toLowerCase();
    const existingPatient = await getPatientByEmail(cleanEmail);

    let patient;
    let isNew = false;

    if (existingPatient) {
      // If already fully assigned to this doctor
      if (
        existingPatient.doctorId === doctorId &&
        existingPatient.linkStatus === 'linked'
      ) {
        return apiSuccess({
          patient: existingPatient,
          message: 'Patient is already linked to your clinic practice.',
        });
      }

      // Propose link / pending patient approval
      patient = await updatePatient(existingPatient.id, {
        pendingDoctorId: doctorId,
        linkStatus: 'pending_patient_approval',
        linkRequestedBy: 'doctor',
        linkRequestedAt: Date.now(),
        // Update name/phone if not already present
        ...(firstName && !existingPatient.firstName ? { firstName } : {}),
        ...(lastName && !existingPatient.lastName ? { lastName } : {}),
        ...(phone && !existingPatient.phone ? { phone } : {}),
      });
    } else {
      // Patient has not yet signed up: create preliminary record with pending approval (NOT linked!)
      isNew = true;
      patient = await createPatient({
        id: `patient-${nanoid()}`,
        email: cleanEmail,
        firstName: firstName || 'Pending',
        lastName: lastName || 'Patient',
        phone,
        pendingDoctorId: doctorId,
        linkStatus: 'pending_patient_approval',
        linkRequestedBy: 'doctor',
        linkRequestedAt: Date.now(),
      });
    }

    // Never return medical history/details before the patient explicitly accepts!
    const sanitizedPatient = {
      id: patient?.id,
      email: patient?.email,
      firstName: patient?.firstName,
      lastName: patient?.lastName,
      linkStatus: patient?.linkStatus,
      linkRequestedAt: patient?.linkRequestedAt,
    };

    return apiSuccess({
      data: sanitizedPatient,
      isNew,
      message: `Invitation sent to ${patient?.firstName || cleanEmail}. Awaiting patient acceptance on their portal.`,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to invite patient');
  }
}
