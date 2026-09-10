/**
 * Canonical Role & Routing Utility
 * Single source of truth for the Role type, getDashboardPath(), isValidRole(),
 * and Cognito group name constants.
 */

export const ROLES = ['doctor', 'patient', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ADMIN_COGNITO_GROUPS = ['Admins', 'Superadmins'] as const;

export const DOCTOR_COGNITO_GROUPS = ['Doctors'] as const;

/**
 * Type guard — returns true if value is a valid Role.
 * Use instead of inline `value === 'doctor' || value === 'patient' || ...`
 */
export function isValidRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLES.includes(value as Role);
}

/**
 * Derives the canonical dashboard path from a role.
 * Dashboard paths follow the convention /dashboard/<role> — no exceptions, no hardcoding elsewhere.
 *
 * Because Cognito's custom:user_type is the authoritative source of truth,
 * this mapping is deterministic — a role always resolves to exactly one path.
 *
 * @returns The dashboard path for the role, or '/auth/login' if role is invalid.
 */
export function getDashboardPath(
  role: Role | string | null | undefined
): string {
  if (!role || !isValidRole(role)) return '/auth/login';
  return `/dashboard/${role}`;
}

/**
 * Extracts the target role from a /dashboard/:role/* pathname.
 * Used by middleware to determine which role a protected route requires.
 *
 * @example getRoleFromPath('/dashboard/doctor/sessions') → 'doctor'
 * @example getRoleFromPath('/auth/login') → null
 */
export function getRoleFromPath(pathname: string): Role | null {
  const segment = pathname.split('/')[2];
  return isValidRole(segment) ? segment : null;
}
