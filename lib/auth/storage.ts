/**
 * Canonical Session Storage Keys
 *
 * All client-side localStorage reads and writes for auth identifiers
 * must go through this module. Never hardcode key strings inline.
 *
 * This is the single source of truth for:
 * - Key names (prevents typos and key drift across files)
 * - clearAuthStorage() — used by logout() AND handleAuthExpiration()
 * - setStoredUserId(role, id) — used after login and session verification
 */

import type { Role } from './roles';

export const AUTH_STORAGE_KEYS = {
  USER_ID: 'userId',
  USER_TYPE: 'userType',
  DOCTOR_ID: 'doctorId',
  PATIENT_ID: 'patientId',
  ADMIN_ID: 'adminId',
  ACTIVE_INTAKE: 'active_intake_session',
  INTAKE_COMPLETION: 'intake-completion',
} as const;

export type AuthStorageKey = (typeof AUTH_STORAGE_KEYS)[keyof typeof AUTH_STORAGE_KEYS];

/**
 * Clears every auth-related localStorage entry in one call.
 * Used by both logout() in auth-context.tsx and handleAuthExpiration() in http.ts.
 * These two callers previously maintained separate, divergent key arrays.
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
}

/**
 * Writes the user ID and userType into localStorage.
 * Writes canonical 'userId' as well as the role-scoped key for full backward compatibility.
 *
 * @example setStoredUserId('doctor', 'abc-123')
 */
export function setStoredUserId(role: Role, id: string): void {
  if (typeof window === 'undefined') return;
  const keyMap: Record<Role, AuthStorageKey> = {
    doctor: AUTH_STORAGE_KEYS.DOCTOR_ID,
    patient: AUTH_STORAGE_KEYS.PATIENT_ID,
    admin: AUTH_STORAGE_KEYS.ADMIN_ID,
  };
  window.localStorage.setItem(AUTH_STORAGE_KEYS.USER_ID, id);
  window.localStorage.setItem(keyMap[role], id);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.USER_TYPE, role);
}

/**
 * Reads the stored active user ID from localStorage.
 */
export function getStoredCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_STORAGE_KEYS.USER_ID);
}

/**
 * Reads the stored role-scoped user ID from localStorage.
 * Returns null if not found or if called server-side.
 */
export function getStoredUserId(role: Role): string | null {
  if (typeof window === 'undefined') return null;
  const keyMap: Record<Role, AuthStorageKey> = {
    doctor: AUTH_STORAGE_KEYS.DOCTOR_ID,
    patient: AUTH_STORAGE_KEYS.PATIENT_ID,
    admin: AUTH_STORAGE_KEYS.ADMIN_ID,
  };
  return window.localStorage.getItem(keyMap[role]) || window.localStorage.getItem(AUTH_STORAGE_KEYS.USER_ID);
}
