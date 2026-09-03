import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Edge Middleware for Role-Based Access Control (RBAC)
 * Enforces HIPAA access controls before protected pages render.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const sessionCookie = request.cookies.get('noa_session')?.value
  const tokenCookie = request.cookies.get('noa_access_token')?.value

  const isAuthenticated = Boolean(sessionCookie || tokenCookie)
  let userType: string | null = null

  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie)
      userType = parsed.userType
    } catch {
      // Malformed cookie ignored
    }
  }

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
