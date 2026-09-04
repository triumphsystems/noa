import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

type Role = 'doctor' | 'patient' | 'admin'

interface RouteGuard {
  prefix: string
  allowedRoles: Role[]
  loginType: 'doctor' | 'patient'
  defaultDashboard: string
}

const ROUTE_GUARDS: RouteGuard[] = [
  {
    prefix: '/dashboard/doctor',
    allowedRoles: ['doctor'],
    loginType: 'doctor',
    defaultDashboard: '/dashboard/doctor',
  },
  {
    prefix: '/dashboard/patient',
    allowedRoles: ['patient'],
    loginType: 'patient',
    defaultDashboard: '/dashboard/patient',
  },
  {
    prefix: '/dashboard/admin',
    allowedRoles: ['admin'],
    loginType: 'doctor',
    defaultDashboard: '/dashboard/admin',
  },
]

function getHomeForRole(role: Role | null): string {
  switch (role) {
    case 'doctor':
      return '/dashboard/doctor'
    case 'patient':
      return '/dashboard/patient'
    case 'admin':
      return '/dashboard/admin'
    default:
      return '/auth/login'
  }
}

/**
 * Next.js Edge Middleware for Role-Based Access Control (RBAC)
 * Enforces strict, zero-trust role segregation (Doctor, Patient, Admin).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Find matching protected route guard
  const guard = ROUTE_GUARDS.find(g => pathname.startsWith(g.prefix))
  if (!guard) {
    return NextResponse.next()
  }

  const auth = getAuthenticatedUser(request)
  const hasRefreshToken = Boolean(request.cookies.get('noa_refresh_token')?.value)

  // 1. Unauthenticated Check
  if (!auth.isValid) {
    // If client has an active 30-day refresh token, allow page load so client-side http interceptor can refresh
    if (hasRefreshToken) {
      return NextResponse.next()
    }

    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('userType', guard.loginType)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Strict Role Segregation
  const userRole = (auth.userType as Role) || null

  // If the user's role is not explicitly listed in allowedRoles, redirect to their own home dashboard
  if (!userRole || !guard.allowedRoles.includes(userRole)) {
    const destination = getHomeForRole(userRole)
    // If the destination is login (unknown role), redirect with notice
    if (destination === '/auth/login') {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.redirect(new URL(destination, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/doctor/:path*',
    '/dashboard/patient/:path*',
    '/dashboard/admin/:path*',
  ],
}
