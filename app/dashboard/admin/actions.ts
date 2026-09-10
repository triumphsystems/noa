'use server';

import { revalidatePath } from 'next/cache';
import { requireServerAuth } from '@/lib/auth/server';
import { getDoctorById, updateDoctorVerification } from '@/lib/db';
import {
  addUserToCognitoGroup,
  removeUserFromCognitoGroup,
} from '@/lib/auth/cognito';

export interface AdminActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function refreshAdminDashboard(): Promise<void> {
  await requireServerAuth(['admin']);
  revalidatePath('/dashboard/admin');
}

export async function approveDoctor(
  doctorId: string
): Promise<AdminActionResult> {
  try {
    const auth = await requireServerAuth(['admin']);
    const doctor = await getDoctorById(doctorId);

    if (!doctor) {
      return { success: false, error: 'Doctor not found' };
    }

    const adminId = auth.sub || 'admin';
    await updateDoctorVerification(doctorId, 'verified', adminId);

    try {
      await addUserToCognitoGroup(doctor.email, 'Doctors');
    } catch (cognitoError) {
      console.warn(
        '[Admin Action] Cognito group warning:',
        cognitoError instanceof Error ? cognitoError.message : cognitoError
      );
    }

    revalidatePath('/dashboard/admin');
    return {
      success: true,
      message: `Dr. ${doctor.name} was successfully verified and granted clinical privileges.`,
    };
  } catch (error) {
    console.error('[Admin Action] Failed to approve doctor:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to approve doctor',
    };
  }
}

export const approveDoctorAction = approveDoctor;

export async function rejectDoctor(
  doctorId: string,
  reason: string
): Promise<AdminActionResult> {
  try {
    const auth = await requireServerAuth(['admin']);
    const doctor = await getDoctorById(doctorId);

    if (!doctor) {
      return { success: false, error: 'Doctor not found' };
    }

    const adminId = auth.sub || 'admin';
    await updateDoctorVerification(doctorId, 'rejected', adminId, reason);

    try {
      await removeUserFromCognitoGroup(doctor.email, 'Doctors');
    } catch {
      // Ignore if not in group
    }

    revalidatePath('/dashboard/admin');
    return {
      success: true,
      message: `Clinical privileges for Dr. ${doctor.name} have been revoked.`,
    };
  } catch (error) {
    console.error('[Admin Action] Failed to reject doctor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject doctor',
    };
  }
}

export const rejectDoctorAction = rejectDoctor;
