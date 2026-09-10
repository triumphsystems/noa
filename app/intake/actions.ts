'use server';

import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { getServerAuth } from '@/lib/auth/server';
import { createIntake, getIntakeById, updateIntake } from '@/lib/db';
import type { PatientIntake } from '@/lib/db/types';

export interface IntakeActionResult {
  success: boolean;
  message?: string;
  error?: string;
  intake?: PatientIntake;
}

export interface IntakeDraftInput {
  intakeId?: string;
  patientId?: string;
  doctorId?: string;
  chiefComplaint?: string;
  summary?: string;
  medicalHistory?: string;
  medications?: string[];
  allergies?: string[];
  surgeries?: string;
  familyHistory?: string;
  socialHistory?: string;
  draft?: Record<string, unknown>;
  completed?: boolean;
}

/**
 * Server Action to save a patient intake form draft directly to DynamoDB.
 */
export async function saveIntakeDraft(
  input: IntakeDraftInput | FormData
): Promise<IntakeActionResult> {
  try {
    const auth = await getServerAuth();

    let raw: Partial<IntakeDraftInput> = {};

    if (input instanceof FormData) {
      const rawDraftStr = input.get('draft') as string;
      let parsedDraft: Record<string, unknown> | undefined;
      if (rawDraftStr) {
        try {
          parsedDraft = JSON.parse(rawDraftStr) as Record<string, unknown>;
        } catch {
          // ignore malformed draft string
        }
      }

      const rawMeds = input.get('medications') as string;
      const rawAllergies = input.get('allergies') as string;

      raw = {
        intakeId: ((input.get('intakeId') as string) || '').trim() || undefined,
        patientId:
          ((input.get('patientId') as string) || '').trim() || undefined,
        doctorId: ((input.get('doctorId') as string) || '').trim() || undefined,
        chiefComplaint:
          ((input.get('chiefComplaint') as string) || '').trim() || undefined,
        summary: ((input.get('summary') as string) || '').trim() || undefined,
        medicalHistory:
          ((input.get('medicalHistory') as string) || '').trim() || undefined,
        surgeries:
          ((input.get('surgeries') as string) || '').trim() || undefined,
        familyHistory:
          ((input.get('familyHistory') as string) || '').trim() || undefined,
        socialHistory:
          ((input.get('socialHistory') as string) || '').trim() || undefined,
        medications: rawMeds
          ? rawMeds.split(',').map((s) => s.trim())
          : undefined,
        allergies: rawAllergies
          ? rawAllergies.split(',').map((s) => s.trim())
          : undefined,
        draft: parsedDraft,
        completed: input.get('completed') === 'true',
      };
    } else {
      raw = input;
    }

    const patientId =
      auth.isValid && auth.userType === 'patient' && auth.sub
        ? auth.sub
        : raw.patientId || `guest-${Date.now()}-${nanoid(6)}`;

    const doctorId = raw.doctorId || '';
    const intakeId = raw.intakeId?.trim();
    const chiefComplaint =
      raw.chiefComplaint || raw.summary || 'Clinical intake draft';
    const summary =
      raw.summary || raw.chiefComplaint || 'Clinical intake draft';
    const completed = Boolean(raw.completed);

    const intakePayload = {
      patientId,
      doctorId,
      chiefComplaint,
      summary,
      medicalHistory: raw.medicalHistory || '',
      medications: raw.medications || [],
      allergies: raw.allergies || [],
      surgeries: raw.surgeries || '',
      familyHistory: raw.familyHistory || '',
      socialHistory: raw.socialHistory || '',
      completed,
      completedAt: completed ? Date.now() : undefined,
      draft: raw.draft || {},
      ttl: completed ? null : Math.floor(Date.now() / 1000) + 7 * 86400,
    };

    let savedIntake: PatientIntake | null = null;

    if (intakeId) {
      const existing = await getIntakeById(intakeId);
      if (existing) {
        savedIntake = await updateIntake(intakeId, intakePayload);
      } else {
        savedIntake = await createIntake({
          id: intakeId,
          ...intakePayload,
        });
      }
    } else {
      savedIntake = await createIntake(intakePayload);
    }

    if (!savedIntake) {
      return { success: false, error: 'Failed to persist intake draft' };
    }

    if (auth.isValid && auth.userType === 'patient') {
      revalidatePath('/dashboard/patient');
    }

    return {
      success: true,
      message: 'Intake draft saved successfully',
      intake: savedIntake,
    };
  } catch (error) {
    console.error('[Actions] Failed to save intake draft:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to save intake draft',
    };
  }
}

export const saveIntakeDraftAction = saveIntakeDraft;
