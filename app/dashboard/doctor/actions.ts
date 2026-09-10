'use server';

import { revalidatePath } from 'next/cache';
import { requireServerAuth } from '@/lib/auth/server';
import { updateDoctor } from '@/lib/db';
import type { Doctor } from '@/lib/db/types';

/**
 * Server Action to revalidate and refresh the Doctor Dashboard data.
 */
export async function refreshDoctorDashboard(): Promise<void> {
  await requireServerAuth(['doctor']);
  revalidatePath('/dashboard/doctor');
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action to update Doctor profile information.
 */
export async function updateDoctorProfileAction(
  updates: Partial<
    Pick<
      Doctor,
      | 'name'
      | 'specialty'
      | 'clinic'
      | 'phone'
      | 'license'
      | 'issuingAuthority'
      | 'licenseDocumentUrl'
      | 'verificationStatus'
    >
  >
): Promise<ActionResult<Doctor>> {
  try {
    const auth = await requireServerAuth(['doctor']);

    const updated = await updateDoctor(auth.sub, {
      ...updates,
      updatedAt: Date.now(),
    });

    if (!updated) {
      return { success: false, error: 'Doctor not found or update failed' };
    }

    revalidatePath('/dashboard/doctor');
    revalidatePath('/dashboard/doctor/settings');
    revalidatePath('/dashboard/doctor/onboarding');

    return { success: true, data: updated };
  } catch (error) {
    console.error('[Actions] Failed to update doctor profile:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
