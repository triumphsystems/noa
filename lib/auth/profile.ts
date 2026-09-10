/**
 * Canonical Profile Resolution
 *
 * Resolves a display name and avatar from DynamoDB for any authenticated user.
 * Called by /api/auth/login, /api/auth/me, and /api/auth/refresh — previously
 * each route had its own incomplete copy of this logic.
 *
 */

import {
  getDoctorById,
  getPatientById,
  getAdminById,
  getAdminByEmail,
} from '@/lib/db';
import type { Role } from './roles';

export interface ResolvedUserProfile {
  id: string;
  email: string;
  name: string;
  userType: Role;
  avatar: string | null;
}

export interface ProfileFallback {
  email?: string;
  name?: string;
}

/**
 * Fetches the canonical display profile for an authenticated user from DynamoDB.
 * Returns null if the user does not exist in the database (never synthesizes phantom profiles).
 *
 * @param sub      The user's Cognito sub (DynamoDB primary key)
 * @param userType The verified role from the Cognito token
 * @param fallback Optional metadata (such as admin email for legacy lookup)
 */
export async function resolveUserProfile(
  sub: string,
  userType: Role,
  fallback?: ProfileFallback
): Promise<ResolvedUserProfile | null> {
  try {
    if (userType === 'doctor') {
      const doctor = await getDoctorById(sub);
      if (doctor) {
        return {
          id: sub,
          email: doctor.email,
          name: doctor.name,
          userType,
          avatar: doctor.avatar ?? null,
        };
      }
    } else if (userType === 'patient') {
      const patient = await getPatientById(sub);
      if (patient) {
        return {
          id: sub,
          email: patient.email,
          name: `${patient.firstName} ${patient.lastName}`.trim(),
          userType,
          avatar: patient.avatar ?? null,
        };
      }
    } else if (userType === 'admin') {
      let admin = await getAdminById(sub);
      if (!admin && fallback?.email) {
        admin = await getAdminByEmail(fallback.email);
      }
      if (admin) {
        return {
          id: sub,
          email: admin.email,
          name: admin.name,
          userType,
          avatar: null,
        };
      }
    }
  } catch (error) {
    console.error(`[Profile] Failed to resolve ${userType} profile for ${sub}:`, error);
  }

  return null;
}
