import type { IntakeConversationDraft } from './types';

export interface IntakeStoredSession {
  draft: IntakeConversationDraft;
  history: Array<{
    id: string;
    role: 'assistant' | 'patient' | 'system';
    text: string;
  }>;
  assistantMessage: string;
  intakeId?: string;
  patientId?: string;
  doctorId?: string;
  detectedLanguage?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'noa_intake_active_session';

export function saveActiveIntakeSession(data: {
  draft: IntakeConversationDraft;
  history: Array<{
    id: string;
    role: 'assistant' | 'patient' | 'system';
    text: string;
  }>;
  assistantMessage: string;
  intakeId?: string;
  patientId?: string;
  doctorId?: string;
  detectedLanguage?: string;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: IntakeStoredSession = {
      ...data,
      updatedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn(
      '[IntakeStorage] Could not save session to sessionStorage:',
      err
    );
  }
}

export function loadActiveIntakeSession(): IntakeStoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IntakeStoredSession;
    // Expire cached session after 4 hours
    if (Date.now() - (parsed.updatedAt || 0) > 4 * 60 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn(
      '[IntakeStorage] Could not load session from sessionStorage:',
      err
    );
    return null;
  }
}

export function clearActiveIntakeSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore clear error
  }
}
