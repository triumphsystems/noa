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
  ACTIVE_INTAKE: 'active_intake_session',
  INTAKE_COMPLETION: 'intake-completion',
} as const;

export type AuthStorageKey =
  (typeof AUTH_STORAGE_KEYS)[keyof typeof AUTH_STORAGE_KEYS];

/**
 * Clears every auth-related localStorage entry in one call.
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  Object.values(AUTH_STORAGE_KEYS).forEach((key) =>
    window.localStorage.removeItem(key)
  );
}

/**
 * Writes the canonical user ID and userType into localStorage.
 *
 * @example setStoredUserId('doctor', 'abc-123')
 */
export function setStoredUserId(role: Role, id: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_STORAGE_KEYS.USER_ID, id);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.USER_TYPE, role);
}
