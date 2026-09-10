'use server';

import { revalidatePath } from 'next/cache';
import { requireServerAuth } from '@/lib/auth/server';
import { updatePatient } from '@/lib/db';

/**
 * Server Action to revalidate and refresh the Patient Dashboard data.
 */
export async function refreshPatientDashboard(): Promise<void> {
  await requireServerAuth(['patient']);
  revalidatePath('/dashboard/patient');
}

export interface PatientActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action to update patient profile information.
 */
export async function updatePatientProfileAction(
  updates: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    bloodGroup: string;
    address: string;
  }>
): Promise<PatientActionResult> {
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
