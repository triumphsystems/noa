import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthenticatedUserSync } from '@/lib/auth/jwt';
import { getDashboardPath, getRoleFromPath, isValidRole } from '@/lib/auth/roles';
import { AUTH_COOKIE_NAMES } from '@/lib/auth/cookies';

/**
 * Next.js Edge Middleware — Role-Based Access Control
 *
 * Two-pattern enforcement:
 * 1. Landing page (/): Redirect authenticated users to their dashboard.
 *    Falls back to noa_session cookie if access token is expired but refresh token exists.
 * 2. Protected routes (/dashboard/:role/*): Verify the token role matches the path role.
 *    If token is expired but refresh token exists, allow through — client will refresh silently.
 *
 * Never add per-route ROUTE_GUARDS tables. The URL path segment IS the guard.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Landing Page ──────────────────────────────────────────────────────────
  if (pathname === '/') {
    const isPublicRequested = request.nextUrl.searchParams.get('public') === 'true';
    if (!isPublicRequested) {
      const auth = getAuthenticatedUserSync(request);

      if (auth.isValid && isValidRole(auth.userType)) {
        // Active valid token — redirect immediately
        return NextResponse.redirect(new URL(getDashboardPath(auth.userType), request.url));
      }

      // Token expired or absent — try the 30-day session hint cookie
      const hasRefreshToken = Boolean(request.cookies.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value);
      const sessionMeta = request.cookies.get(AUTH_COOKIE_NAMES.SESSION_META)?.value;
      if (hasRefreshToken && sessionMeta) {
        try {
          const parsed = JSON.parse(sessionMeta) as Record<string, unknown>;
          const hintedRole = parsed.userType;
          if (isValidRole(hintedRole)) {
            // Redirect to dashboard — it will silently refresh the token on load
            return NextResponse.redirect(new URL(getDashboardPath(hintedRole), request.url));
          }
        } catch {
          // Malformed session cookie — fall through to landing page
        }
      }
    }
    return NextResponse.next();
  }

  // ─── Protected Dashboard Routes ─────────────────────────────────────────────
  const targetRole = getRoleFromPath(pathname);
  if (!targetRole) {
    return NextResponse.next();
  }

  const auth = getAuthenticatedUserSync(request);
  const hasRefreshToken = Boolean(request.cookies.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value);

  if (!auth.isValid) {
    // Expired token with active refresh token — let the client-side http interceptor refresh
    if (hasRefreshToken) return NextResponse.next();
    // Fully unauthenticated — redirect to login
    return NextResponse.redirect(
      new URL(`/auth/login?from=${encodeURIComponent(pathname)}`, request.url),
    );
  }

  // Valid token but wrong role for this path — send to their own dashboard
  if (auth.userType !== targetRole) {
    return NextResponse.redirect(new URL(getDashboardPath(auth.userType), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/doctor/:path*', '/dashboard/patient/:path*', '/dashboard/admin/:path*'],
};
