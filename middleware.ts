import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

/**
 * Next.js Edge Middleware for Role-Based Access Control (RBAC)
 * Enforces HIPAA access controls before protected pages render.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const auth = getAuthenticatedUser(request)
  const isAuthenticated = auth.isValid
  const userType = auth.userType || null


  // 1. Protect Doctor Dashboard
  if (pathname.startsWith('/dashboard/doctor')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('userType', 'doctor')
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (userType && userType !== 'doctor') {
      return NextResponse.redirect(new URL('/dashboard/patient', request.url))
    }
  }

  // 2. Protect Patient Dashboard
  if (pathname.startsWith('/dashboard/patient')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('userType', 'patient')
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (userType && userType !== 'patient') {
      return NextResponse.redirect(new URL('/dashboard/doctor', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/doctor/:path*',
    '/dashboard/patient/:path*',
  ],
}
