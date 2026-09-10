/**
 * Canonical Profile Resolution
 *
 * Resolves a display name and avatar from DynamoDB for any authenticated user.
 * Called by /api/auth/login, /api/auth/me, and /api/auth/refresh — previously
 * each route had its own incomplete copy of this logic.
 *
 * Never throws — all DynamoDB failures return a Cognito-derived fallback.
 */

import { getDoctorById, getPatientById, getAdminByEmail } from '@/lib/db';
import type { Role } from './roles';

export interface ResolvedUserProfile {
  id: string;
  email: string;
  name: string;
  userType: Role;
  avatar: string | null;
}

export interface ProfileFallback {
  email: string;
  name: string;
}

/**
 * Fetches the canonical display profile for an authenticated user.
 *
 * Resolution order:
 * 1. DynamoDB record (doctor / patient / admin table lookup)
 * 2. Cognito-derived fallback (email + name from token)
 *
 * @param sub      The user's Cognito sub (used as DynamoDB primary key for doctor/patient)
 * @param userType The verified role from the Cognito token
 * @param fallback Cognito-derived email and name to fall back to on DB miss
 */
export async function resolveUserProfile(
  sub: string,
  userType: Role,
  fallback: ProfileFallback
): Promise<ResolvedUserProfile> {
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
      const admin = await getAdminByEmail(fallback.email);
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
  } catch {
    // Non-fatal: DB lookup failures gracefully return the Cognito fallback below
  }

  return {
    id: sub,
    email: fallback.email,
    name: fallback.name,
    userType,
    avatar: null,
  };
}
