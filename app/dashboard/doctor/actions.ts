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
export async function updateDoctorProfile(
  updates: Partial<
    Pick<
      Doctor,
      | 'name'
      | 'specialty'
      | 'clinic'
      | 'phone'
      | 'avatar'
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

export const updateDoctorProfileAction = updateDoctorProfile;

export interface SaveSessionInput {
  sessionId?: string;
  patientId: string;
  transcript?: string;
  soapNote?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
}

/**
 * Server Action to save or complete a clinical consultation session.
 */
export async function saveSession(
  input: SaveSessionInput
): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const auth = await requireServerAuth(['doctor']);

    const { getSessionById, createSession, updateSession } = await import('@/lib/db');

    const targetId = input.sessionId;
    let savedSessionId = targetId || '';

    if (targetId) {
      const existing = await getSessionById(targetId);
      if (existing) {
        if (existing.doctorId !== auth.sub) {
          return { success: false, error: 'Unauthorized to modify this consultation' };
        }
        await updateSession(targetId, {
          patientId: input.patientId,
          transcript: input.transcript || existing.transcript,
          status: 'completed',
          endedAt: Date.now(),
          soapNote: input.soapNote
            ? {
                subjective: input.soapNote.subjective || '',
                objective: input.soapNote.objective || '',
                assessment: input.soapNote.assessment || '',
                plan: input.soapNote.plan || '',
                generatedAt: Date.now(),
              }
            : existing.soapNote,
        });
      } else {
        const created = await createSession({
          id: targetId,
          doctorId: auth.sub,
          patientId: input.patientId,
          startedAt: Date.now(),
          endedAt: Date.now(),
          transcript: input.transcript,
          status: 'completed',
          soapNote: input.soapNote
            ? {
                subjective: input.soapNote.subjective || '',
                objective: input.soapNote.objective || '',
                assessment: input.soapNote.assessment || '',
                plan: input.soapNote.plan || '',
                generatedAt: Date.now(),
              }
            : undefined,
        });
        savedSessionId = created.id;
      }
    } else {
      const created = await createSession({
        doctorId: auth.sub,
        patientId: input.patientId,
        startedAt: Date.now(),
        endedAt: Date.now(),
        transcript: input.transcript,
        status: 'completed',
        soapNote: input.soapNote
          ? {
              subjective: input.soapNote.subjective || '',
              objective: input.soapNote.objective || '',
              assessment: input.soapNote.assessment || '',
              plan: input.soapNote.plan || '',
              generatedAt: Date.now(),
            }
          : undefined,
      });
      savedSessionId = created.id;
    }

    revalidatePath('/dashboard/doctor');
    revalidatePath('/dashboard/doctor/summaries');
    revalidatePath(`/dashboard/doctor/patients/${input.patientId}`);
    revalidatePath('/dashboard/patient');

    return { success: true, data: { sessionId: savedSessionId } };
  } catch (error) {
    console.error('[Actions] Failed to save clinical session:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to save session',
    };
  }
}

export const saveSessionAction = saveSession;

export { submitLicensure, submitLicensureAction } from './onboarding/actions';

