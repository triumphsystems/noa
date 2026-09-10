/**
 * Canonical Server-Side Auth Utilities for React Server Components (RSC) and Server Actions
 *
 * Uses `next/headers` (cookies, headers) to verify authentication and enforce RBAC
 * directly on the server without client-side network roundtrips.
 */

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from './jwt';
import { AUTH_COOKIE_NAMES } from './cookies';
import { isValidRole, getDashboardPath, type Role } from './roles';
import { resolveUserProfile, type ResolvedUserProfile } from './profile';

export type ServerAuthResult =
  | {
      isValid: true;
      sub: string;
      userType: Role;
      email?: string;
      groups?: string[];
    }
  | {
      isValid: false;
      sub?: undefined;
      userType?: undefined;
      email?: undefined;
      groups?: undefined;
    };

export interface VerifiedServerAuth {
  sub: string;
  userType: Role;
  email?: string;
  groups?: string[];
}

/**
 * Resolves the authenticated session from cookies and authorization headers in Server Components or Server Actions.
 * Returns { isValid: true, sub, userType, ... } or { isValid: false }.
 */
export async function getServerAuth(): Promise<ServerAuthResult> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();

    const authHeader = headerStore.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : undefined;

    const idToken = cookieStore.get(AUTH_COOKIE_NAMES.ID_TOKEN)?.value;
    const accessToken =
      bearerToken || cookieStore.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value;

    const verified = await verifyToken(idToken, accessToken);
    if (!verified.isValid || !verified.sub || !isValidRole(verified.userType)) {
      return { isValid: false };
    }

    const sessionMeta = cookieStore.get(AUTH_COOKIE_NAMES.SESSION_META)?.value;
    let email = verified.email;
    if (!email && sessionMeta) {
      try {
        const parsed = JSON.parse(sessionMeta) as { email?: string };
        if (typeof parsed.email === 'string') {
          email = parsed.email;
        }
      } catch {
        // Session meta is strictly informational
      }
    }

    return {
      isValid: true,
      sub: verified.sub,
      userType: verified.userType,
      email,
      groups: verified.groups,
    };
  } catch (error) {
    console.error('[Auth Server] Failed to get server auth:', error);
    return { isValid: false };
  }
}

/**
 * Enforces authentication and optional role authorization on the server.
 * If unauthenticated or unauthorized, immediately performs a server-side redirect().
 *
 * @param allowedRoles  If specified, the user must have one of these roles.
 * @param redirectTo    Optional redirect path if unauthenticated (defaults to /auth/login).
 * @returns Non-null verified auth session object.
 */
export async function requireServerAuth(
  allowedRoles?: ReadonlyArray<Role>,
  redirectTo?: string
): Promise<VerifiedServerAuth> {
  const auth = await getServerAuth();

  if (!auth.isValid) {
    redirect(redirectTo || '/auth/login');
  }

  if (allowedRoles && !allowedRoles.includes(auth.userType)) {
    // Redirect to the user's appropriate dashboard
    redirect(getDashboardPath(auth.userType));
  }

  return {
    sub: auth.sub,
    userType: auth.userType,
    email: auth.email,
    groups: auth.groups,
  };
}

/**
 * Resolves the full user profile from DynamoDB for the currently authenticated user.
 * Returns null if unauthenticated or profile not found in DynamoDB.
 */
export async function getServerProfile(): Promise<ResolvedUserProfile | null> {
  const auth = await getServerAuth();
  if (!auth.isValid) return null;
  return resolveUserProfile(auth.sub, auth.userType);
}
