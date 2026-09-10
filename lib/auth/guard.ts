/**
 * Canonical Server-Side Auth Guard
 *
 * Every protected API route must call requireAuth() at the top of its handler.
 * NEVER call getAuthenticatedUser() directly in route handlers. Use requireAuth().
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, type VerifiedAuthPayload } from './jwt';
import { isValidRole, type Role } from './roles';

/** The auth payload guaranteed to have sub and userType when ok: true */
export type VerifiedAuth = Required<
  Pick<VerifiedAuthPayload, 'sub' | 'userType'>
> &
  VerifiedAuthPayload;

export type AuthGuardResult =
  { ok: true; auth: VerifiedAuth } | { ok: false; response: NextResponse };

/**
 * Verifies authentication and optionally enforces role-based authorization.
 *
 * Returns a discriminated union:
 * - { ok: true, auth }  → auth.sub and auth.userType are non-optional strings
 * - { ok: false, response } → return this response directly from your handler
 *
 * @param request      The incoming NextRequest
 * @param allowedRoles If provided, verified userType must be in this list
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const guard = await requireAuth(request, ['doctor', 'admin']);
 *   if (!guard.ok) return guard.response;
 *   const { auth } = guard; // auth.sub, auth.userType guaranteed non-undefined
 * }
 */
export async function requireAuth(
  request: NextRequest,
  allowedRoles?: ReadonlyArray<Role>
): Promise<AuthGuardResult> {
  const auth = await getAuthenticatedUser(request);

  if (!auth.isValid || !auth.sub || !isValidRole(auth.userType)) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (allowedRoles && !allowedRoles.includes(auth.userType)) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    auth: auth as VerifiedAuth,
  };
}
