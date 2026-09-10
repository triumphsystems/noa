'use server';

import { revalidatePath } from 'next/cache';
import { requireServerAuth } from '@/lib/auth/server';
import {
  getPatientById,
  getDoctorById,
  getDoctorByCareCode,
  updatePatient,
  computeDoctorCareCode,
} from '@/lib/db';
import type { Patient, Doctor } from '@/lib/db/types';

export interface PatientActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action to revalidate and refresh the Patient Dashboard data.
 */
export async function refreshPatientDashboard(): Promise<void> {
  await requireServerAuth(['patient']);
  revalidatePath('/dashboard/patient');
}

/**
 * Server Action to fetch patient dashboard data directly.
 */
export async function getPatientDashboardData(): Promise<
  PatientActionResult<import('@/lib/types/patient.types').PatientDashboardPayload>
> {
  try {
    const auth = await requireServerAuth(['patient']);
    const { getPatientData } = await import('@/lib/data/patient');
    const data = await getPatientData(auth.sub);

    if (!data) {
      return { success: false, error: 'Patient data not found' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Actions] Failed to fetch patient data:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to load patient data',
    };
  }
}

export const getPatientDashboardDataAction = getPatientDashboardData;

/**
 * Server Action to update patient profile information.
 */
export async function updatePatientProfile(
  updates: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    bloodGroup: string;
    address: string;
  }>
): Promise<PatientActionResult<Patient>> {
  try {
    const auth = await requireServerAuth(['patient']);

    const updated = await updatePatient(auth.sub, {
      ...updates,
      updatedAt: Date.now(),
    });

    if (!updated) {
      return { success: false, error: 'Patient not found or update failed' };
    }

    revalidatePath('/dashboard/patient');
    return { success: true, data: updated };
  } catch (error) {
    console.error('[Actions] Failed to update patient profile:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export const updatePatientProfileAction = updatePatientProfile;

export type RespondDoctorLinkInput =
  | 'accept'
  | 'decline'
  | FormData
  | {
      action: 'accept' | 'decline';
    };

/**
 * Server Action for patient to respond to a doctor's connection invitation.
 */
export async function respondToDoctorLink(
  input: RespondDoctorLinkInput
): Promise<PatientActionResult<{ message: string; doctor: Doctor | null }>> {
  try {
    const auth = await requireServerAuth(['patient']);
    const patient = await getPatientById(auth.sub);

    if (!patient) {
      return { success: false, error: 'Patient profile not found' };
    }

    const action =
      typeof input === 'string'
        ? input
        : input instanceof FormData
          ? (input.get('action') as 'accept' | 'decline')
          : input.action;

    if (action !== 'accept' && action !== 'decline') {
      return {
        success: false,
        error: 'Valid action (accept or decline) is required',
      };
    }

    if (
      patient.linkStatus !== 'pending_patient_approval' ||
      !patient.pendingDoctorId
    ) {
      return {
        success: false,
        error: 'No pending doctor connection request found.',
      };
    }

    const doctor = await getDoctorById(patient.pendingDoctorId);

    if (action === 'accept') {
      await updatePatient(patient.id, {
        doctorId: patient.pendingDoctorId,
        pendingDoctorId: null,
        linkStatus: 'linked',
        linkRequestedAt: Date.now(),
      });

      revalidatePath('/dashboard/patient');
      if (patient.pendingDoctorId) {
        revalidatePath(`/dashboard/doctor/patients`);
      }

      return {
        success: true,
        data: {
          doctor,
          message: doctor
            ? `You are now securely connected with Dr. ${doctor.name}.`
            : 'Doctor connection approved.',
        },
      };
    } else {
      await updatePatient(patient.id, {
        pendingDoctorId: null,
        linkStatus: 'unlinked',
      });

      revalidatePath('/dashboard/patient');
      return {
        success: true,
        data: {
          doctor: null,
          message: 'Doctor invitation declined.',
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Action failed to process',
    };
  }
}

export type LinkDoctorInput =
  | string
  | FormData
  | {
      careCode?: string;
      doctorId?: string;
    };

/**
 * Server Action for patient to connect to a doctor via Care Code or Doctor ID.
 */
export async function linkDoctorCareCode(
  input: LinkDoctorInput
): Promise<PatientActionResult<{ message: string; doctor?: Partial<Doctor> }>> {
  try {
    const auth = await requireServerAuth(['patient']);
    const patient = await getPatientById(auth.sub);

    if (!patient) {
      return { success: false, error: 'Patient profile not found' };
    }

    let careCode: string | undefined;
    let doctorId: string | undefined;

    if (typeof input === 'string') {
      careCode = input.trim();
    } else if (input instanceof FormData) {
      careCode = (input.get('careCode') as string)?.trim() || undefined;
      doctorId = (input.get('doctorId') as string)?.trim() || undefined;
    } else {
      careCode = input.careCode?.trim();
      doctorId = input.doctorId?.trim();
    }

    if (!careCode && !doctorId) {
      return {
        success: false,
        error: 'Either doctor care code or doctor ID is required',
      };
    }

    let targetDoctor: Doctor | null = null;
    if (careCode) {
      targetDoctor = await getDoctorByCareCode(careCode);
    } else if (doctorId) {
      targetDoctor = await getDoctorById(doctorId);
    }

    if (!targetDoctor) {
      return {
        success: false,
        error: 'Doctor not found with the provided code or ID',
      };
    }

    await updatePatient(patient.id, {
      pendingDoctorId: targetDoctor.id,
      linkStatus: 'pending_doctor_approval',
      linkRequestedBy: 'patient',
      linkRequestedAt: Date.now(),
    });

    revalidatePath('/dashboard/patient');
    revalidatePath('/dashboard/doctor/patients');

    return {
      success: true,
      data: {
        message: `Connection request submitted to Dr. ${targetDoctor.name}. Your care relationship will be active once reviewed by the clinician.`,
        doctor: {
          id: targetDoctor.id,
          name: targetDoctor.name,
          specialty: targetDoctor.specialty,
          clinic: targetDoctor.clinic,
          careCode: targetDoctor.careCode || computeDoctorCareCode(targetDoctor),
          email: targetDoctor.email,
        },
      },
    };
  } catch (error) {
    console.error('[Actions] Failed to connect doctor:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to connect to doctor',
    };
  }
}

export const connectDoctor = linkDoctorCareCode;
export const connectDoctorAction = linkDoctorCareCode;

export type SanitizedDoctorDirectoryItem = Pick<
  Doctor,
  'id' | 'name' | 'specialty' | 'clinic' | 'careCode' | 'avatar'
>;

/**
 * Server Action for searching verified doctors from the directory.
 */
export async function searchDoctors(
  queryStr: string
): Promise<PatientActionResult<SanitizedDoctorDirectoryItem[]>> {
  try {
    await requireServerAuth(['patient']);
    const { searchDoctors: dbSearchDoctors, getAllDoctors } = await import('@/lib/db');

    const q = (queryStr || '').trim();
    let doctors: Doctor[] = [];

    if (q) {
      doctors = await dbSearchDoctors(q);
    } else {
      doctors = await getAllDoctors();
    }

    const sanitized: SanitizedDoctorDirectoryItem[] = doctors
      .filter((doc) => doc.verificationStatus === 'verified')
      .map((doc) => ({
        id: doc.id,
        name: doc.name,
        specialty: doc.specialty,
        clinic: doc.clinic,
        careCode: doc.careCode,
        avatar: doc.avatar,
      }));

    return { success: true, data: sanitized };
  } catch (error) {
    console.error('[Actions] Failed to search doctors:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to search doctors',
    };
  }
}

export const searchDoctorsAction = searchDoctors;

export { saveIntakeDraft } from '@/app/intake/actions';

