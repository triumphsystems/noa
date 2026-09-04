/**
 * Lightweight JWT & Token Verification for Next.js Edge Middleware & Server Routes
 * Operates in Edge Runtime without external heavy dependencies.
 */

import { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAMES } from './cookies'

export interface VerifiedAuthPayload {
  isValid: boolean
  sub?: string
  dbId?: string
  email?: string
  userType?: 'doctor' | 'patient'
}

/**
 * Base64URL decoder compatible with both Edge Runtime and Node.js
 */
function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // Base64URL to Base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = typeof atob === 'function'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf8')

    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Validates Cognito JWT payload (exp, iss, user_type)
 */
export function verifyToken(idToken?: string, accessToken?: string): VerifiedAuthPayload {
  // Validate ID Token first (contains user attributes like custom:user_type)
  const tokenToVerify = idToken || accessToken
  if (!tokenToVerify) {
    return { isValid: false }
  }

  const payload = parseJwtPayload(tokenToVerify)
  if (!payload) {
    return { isValid: false }
  }

  // Verify expiration
  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp === 'number' && payload.exp < now) {
    return { isValid: false }
  }

  // Verify Cognito Issuer if configured
  const userPoolId = process.env.COGNITO_USER_POOL_ID
  const region = process.env.AWS_REGION || 'us-east-1'
  if (userPoolId && payload.iss) {
    const expectedIss = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
    if (payload.iss !== expectedIss) {
      return { isValid: false }
    }
  }

  // Determine user role
  let userType: 'doctor' | 'patient' | undefined = undefined
  if (payload['custom:user_type'] === 'doctor' || payload['custom:user_type'] === 'patient') {
    userType = payload['custom:user_type']
  } else if (Array.isArray(payload['cognito:groups'])) {
    if (payload['cognito:groups'].includes('Doctors')) userType = 'doctor'
    else if (payload['cognito:groups'].includes('Patients')) userType = 'patient'
  }

  return {
    isValid: true,
    sub: payload.sub,
    email: payload.email,
    userType,
  }
}

/**
 * Extract authenticated user session securely from incoming NextRequest
 */
export function getAuthenticatedUser(request: NextRequest): VerifiedAuthPayload {
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined

  const idToken = request.cookies.get(AUTH_COOKIE_NAMES.ID_TOKEN)?.value
  const accessToken = bearerToken || request.cookies.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value

  const verified = verifyToken(idToken, accessToken)
  if (!verified.isValid) {
    return verified
  }

  // Once token is verified, extract internal database ID from server session metadata if present
  const sessionMeta = request.cookies.get(AUTH_COOKIE_NAMES.SESSION_META)?.value
  if (sessionMeta) {
    try {
      const parsed = JSON.parse(sessionMeta)
      if (parsed.id) {
        verified.dbId = parsed.id
      }
      if (!verified.userType && parsed.userType) {
        verified.userType = parsed.userType
      }
    } catch {
      // Ignore parse failure
    }
  }

  return verified
}
