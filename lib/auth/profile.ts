/**
 * Canonical Profile Resolution
 *
 * Resolves a display name and avatar from DynamoDB for any authenticated user.
 * Called by /api/auth/login, /api/auth/me, and /api/auth/refresh — previously
 * each route had its own incomplete copy of this logic.
 *
 */

import { getUserById } from '@/lib/db';
import type { Role } from './roles';

export interface ResolvedUserProfile {
  id: string;
  email: string;
  name: string;
  userType: Role;
  avatar: string | null;
}

/**
 * Fetches the canonical display profile for an authenticated user from DynamoDB.
 * Queries DynamoDB directly by primary key: (PK=sub, SK=userType).
 * Returns null if the user does not exist in the database.
 *
 * @param sub      The user's Cognito sub (DynamoDB primary key)
 * @param userType The verified role from the Cognito token
 */
export async function resolveUserProfile(
  sub: string,
  userType: Role
): Promise<ResolvedUserProfile | null> {
  try {
    const user = await getUserById(sub, userType);
    if (!user) return null;

    const name =
      'name' in user && user.name
        ? user.name
        : 'firstName' in user && user.firstName
          ? `${user.firstName} ${user.lastName || ''}`.trim()
          : 'User';

    const avatar = 'avatar' in user ? user.avatar ?? null : null;

    return {
      id: user.id,
      email: user.email,
      name,
      userType,
      avatar,
    };
  } catch (error) {
    console.error(`[Profile] Failed to resolve ${userType} profile for ${sub}:`, error);
    return null;
  }
}
