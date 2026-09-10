'use server';

import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { requireServerAuth } from '@/lib/auth/server';
import {
  getDoctorById,
  getPatientById,
  getPatientByEmail,
  createPatient,
  updatePatient,
} from '@/lib/db';
import { patientInviteSchema } from '@/lib/validations';

export interface PatientActionResult {
  success: boolean;
  message?: string;
  error?: string;
  patient?: unknown;
}

export type InvitePatientInput =
  | FormData
  | {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };

export async function invitePatient(
  input: InvitePatientInput
): Promise<PatientActionResult> {
  try {
    const auth = await requireServerAuth(['doctor']);
    const doctorId = auth.sub;

    const rawData =
      input instanceof FormData
        ? {
            email: (input.get('email') as string) || '',
            firstName: (input.get('firstName') as string) || undefined,
            lastName: (input.get('lastName') as string) || undefined,
            phone: (input.get('phone') as string) || undefined,
          }
        : input;

    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      return { success: false, error: 'Doctor record not found' };
    }

    if (doctor.verificationStatus !== 'verified') {
      return {
        success: false,
        error:
          'Your medical credentials must be verified by clinical administration before inviting patients.',
      };
    }

    const parseResult = patientInviteSchema.safeParse(rawData);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid invite input',
      };
    }

    const { email, firstName, lastName, phone } = parseResult.data;
    const cleanEmail = email.toLowerCase();
    const existingPatient = await getPatientByEmail(cleanEmail);

    let patient;

    if (existingPatient) {
      if (
        existingPatient.doctorId === doctorId &&
        existingPatient.linkStatus === 'linked'
      ) {
        return {
          success: true,
          message: 'Patient is already linked to your clinic practice.',
        };
      }

      patient = await updatePatient(existingPatient.id, {
        pendingDoctorId: doctorId,
        linkStatus: 'pending_patient_approval',
        linkRequestedBy: 'doctor',
        linkRequestedAt: Date.now(),
        ...(firstName && !existingPatient.firstName ? { firstName } : {}),
        ...(lastName && !existingPatient.lastName ? { lastName } : {}),
        ...(phone && !existingPatient.phone ? { phone } : {}),
      });
    } else {
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

    revalidatePath('/dashboard/doctor/patients');
    revalidatePath('/dashboard/doctor');

    return {
      success: true,
      message: `Invitation sent to ${patient?.firstName || cleanEmail}. Awaiting patient acceptance on their portal.`,
      patient,
    };
  } catch (error) {
    console.error('[Actions] Failed to invite patient:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to invite patient',
    };
  }
}

export async function respondToPatientLink(
  patientId: string,
  action: 'accept' | 'decline'
): Promise<PatientActionResult> {
  try {
    const auth = await requireServerAuth(['doctor']);
    const doctorId = auth.sub;

    const patient = await getPatientById(patientId);
    if (!patient) {
      return { success: false, error: 'Patient profile not found' };
    }

    if (
      patient.linkStatus !== 'pending_doctor_approval' ||
      patient.pendingDoctorId !== doctorId
    ) {
      return {
        success: false,
        error:
          'No pending connection request from this patient found for your account.',
      };
    }

    const doctor = await getDoctorById(doctorId);
    if (!doctor || doctor.verificationStatus !== 'verified') {
      return {
        success: false,
        error:
          'Your medical credentials must be verified before connecting with patients.',
      };
    }

    if (action === 'accept') {
      await updatePatient(patient.id, {
        doctorId: doctorId,
        pendingDoctorId: null,
        linkStatus: 'linked',
        linkRequestedAt: Date.now(),
      });
    } else {
      await updatePatient(patient.id, {
        pendingDoctorId: null,
        linkStatus: 'unlinked',
      });
    }

    revalidatePath('/dashboard/doctor/patients');
    revalidatePath('/dashboard/doctor');

    return {
      success: true,
      message:
        action === 'accept'
          ? `Patient ${patient.firstName} ${patient.lastName} has been approved and linked to your practice.`
          : 'Patient connection request declined.',
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to process connection request',
    };
  }
}

export const invitePatientAction = invitePatient;
export const respondToPatientLinkAction = respondToPatientLink;
