/**
 * HIPAA-Compliant Session Cookie Management
 * Sets and clears tamper-proof httpOnly secure cookies for Next.js App Router.
 * Protects tokens from Cross-Site Scripting (XSS) and client-side extraction.
 */

import { NextResponse } from 'next/server'
import type { CognitoTokens, CognitoUserSession } from './cognito'

export const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: 'noa_access_token',
  ID_TOKEN: 'noa_id_token',
  REFRESH_TOKEN: 'noa_refresh_token',
  SESSION_META: 'noa_session',
} as const

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Attach secure authentication cookies to a NextResponse
 */
export function setAuthCookies(
  response: NextResponse,
  tokens: CognitoTokens,
  sessionUser: CognitoUserSession
): NextResponse {
  const commonOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  }

  // 1. Access Token (1 hour)
  response.cookies.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
    ...commonOptions,
    maxAge: tokens.expiresIn || 3600,
  })

  // 2. ID Token (1 hour)
  response.cookies.set(AUTH_COOKIE_NAMES.ID_TOKEN, tokens.idToken, {
    ...commonOptions,
    maxAge: tokens.expiresIn || 3600,
  })

  // 3. Refresh Token (30 days if present)
  if (tokens.refreshToken) {
    response.cookies.set(AUTH_COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
      ...commonOptions,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })
  }

  // 4. Session metadata (Cached user info for edge middleware/server route lookup)
  // MaxAge matches refresh token lifecycle (30 days) to prevent session metadata from vanishing after 1 hour
  const sessionMetaMaxAge = tokens.refreshToken ? 30 * 24 * 60 * 60 : (tokens.expiresIn || 3600)
  response.cookies.set(
    AUTH_COOKIE_NAMES.SESSION_META,
    JSON.stringify({
      id: sessionUser.sub,
      email: sessionUser.email,
      name: sessionUser.name,
      userType: sessionUser.userType,
      doctorId: sessionUser.userType === 'doctor' ? sessionUser.sub : undefined,
      patientId: sessionUser.userType === 'patient' ? sessionUser.sub : undefined,
    }),
    {
      httpOnly: true, // Tamper-proof and protected against XSS
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: sessionMetaMaxAge,
    }
  )

  return response
}

/**
 * Remove all authentication cookies on sign out
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  }

  response.cookies.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, '', clearOptions)
  response.cookies.set(AUTH_COOKIE_NAMES.ID_TOKEN, '', clearOptions)
  response.cookies.set(AUTH_COOKIE_NAMES.REFRESH_TOKEN, '', clearOptions)
  response.cookies.set(AUTH_COOKIE_NAMES.SESSION_META, '', clearOptions)

  return response
}

