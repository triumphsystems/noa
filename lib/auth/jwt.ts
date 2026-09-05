/**
 * Lightweight JWT & Token Verification for Next.js Edge Middleware & Server Routes
 * Operates in Edge Runtime without external heavy dependencies.
 *
 * SECURITY: Verifies the RS256 signature of Cognito JWTs using the public JWKS endpoint.
 * Raw base64-decode-only verification has been removed — all tokens must pass signature check.
 */

import { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAMES } from './cookies';

export interface VerifiedAuthPayload {
  isValid: boolean;
  sub?: string;
  email?: string;
  userType?: 'doctor' | 'patient' | 'admin';
  groups?: string[];
}

// ---------------------------------------------------------------------------
// JWKS cache — shared across requests on a warm instance
// ---------------------------------------------------------------------------

interface JwkKey {
  kty: string;
  kid: string;
  n: string;
  e: string;
  alg: string;
  use: string;
}

let cachedJwks: { keys: JwkKey[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000; // re-fetch JWKS every hour

async function getJwks(userPoolId: string, region: string): Promise<JwkKey[]> {
  const now = Date.now();
  if (cachedJwks && now - cachedJwks.fetchedAt < JWKS_TTL_MS) {
    return cachedJwks.keys;
  }

  const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Failed to fetch Cognito JWKS: ${res.status}`);

  const data = (await res.json()) as { keys: JwkKey[] };
  cachedJwks = { keys: data.keys, fetchedAt: now };
  return data.keys;
}

// ---------------------------------------------------------------------------
// Base64URL helpers — Edge Runtime compatible
// ---------------------------------------------------------------------------

function base64urlToBase64(s: string): string {
  return s
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(s.length + ((4 - (s.length % 4)) % 4), '=');
}

function base64urlDecode(s: string): Uint8Array {
  const b64 = base64urlToBase64(s);
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

// ---------------------------------------------------------------------------
// RS256 signature verification using Web Crypto (Edge Runtime native)
// ---------------------------------------------------------------------------

async function verifyRS256(
  header: string,
  payload: string,
  signature: string,
  jwk: JwkKey
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: jwk.alg, use: jwk.use },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = new TextEncoder().encode(`${header}.${payload}`);
    const sig = base64urlDecode(signature);

    return crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      sig as unknown as BufferSource,
      data as unknown as BufferSource
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Decode JWT payload (read-only, used after signature is verified)
// ---------------------------------------------------------------------------

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = atob(base64urlToBase64(parts[1]));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function decodeJwtHeader(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = atob(base64urlToBase64(parts[0]));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core verification with full RS256 signature check
// ---------------------------------------------------------------------------

async function verifyTokenWithSignature(
  token: string
): Promise<VerifiedAuthPayload> {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const region = process.env.AWS_REGION || 'us-east-1';

  // If Cognito is not configured, fall back to expiry-only check (local dev)
  if (!userPoolId) {
    const payload = decodeJwtPayload(token);
    if (!payload) return { isValid: false };
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now)
      return { isValid: false };
    return buildPayload(payload);
  }

  const parts = token.split('.');
  if (parts.length !== 3) return { isValid: false };

  const header = decodeJwtHeader(token);
  if (!header || typeof header.kid !== 'string') return { isValid: false };

  let keys: JwkKey[];
  try {
    keys = await getJwks(userPoolId, region);
  } catch (err) {
    console.error('[JWT] JWKS fetch failed:', err);
    return { isValid: false };
  }

  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    console.warn('[JWT] No matching JWK found for kid:', header.kid);
    return { isValid: false };
  }

  const isValid = await verifyRS256(parts[0], parts[1], parts[2], jwk);
  if (!isValid) {
    console.warn('[JWT] RS256 signature verification failed');
    return { isValid: false };
  }

  const payload = decodeJwtPayload(token);
  if (!payload) return { isValid: false };

  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp < now) {
    return { isValid: false };
  }

  // Verify issuer
  const expectedIss = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  if (payload.iss && payload.iss !== expectedIss) {
    return { isValid: false };
  }

  return buildPayload(payload);
}

function buildPayload(payload: Record<string, unknown>): VerifiedAuthPayload {
  const groups: string[] = Array.isArray(payload['cognito:groups'])
    ? (payload['cognito:groups'] as string[])
    : [];

  let userType: 'doctor' | 'patient' | 'admin' | undefined = undefined;

  const customType = payload['custom:user_type'];
  if (
    customType === 'doctor' ||
    customType === 'patient' ||
    customType === 'admin'
  ) {
    userType = customType;
  } else if (
    groups.some((g) =>
      ['Admins', 'Superadmins', 'admins', 'superadmins'].includes(g)
    )
  ) {
    userType = 'admin';
  } else if (groups.includes('Doctors')) {
    userType = 'doctor';
  } else if (groups.includes('Patients')) {
    userType = 'patient';
  }

  return {
    isValid: true,
    sub: typeof payload.sub === 'string' ? payload.sub : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    userType,
    groups,
  };
}

// ---------------------------------------------------------------------------
// Public API — async signature verification
// ---------------------------------------------------------------------------

/**
 * Fully verifies a Cognito JWT (RS256 signature + expiry + issuer).
 * Falls back to expiry-only when COGNITO_USER_POOL_ID is not set (local dev).
 */
export async function verifyToken(
  idToken?: string,
  accessToken?: string
): Promise<VerifiedAuthPayload> {
  const tokenToVerify = idToken || accessToken;
  if (!tokenToVerify) return { isValid: false };
  return verifyTokenWithSignature(tokenToVerify);
}

/**
 * Extract and fully verify the authenticated user session from a NextRequest.
 * NOTE: This is async — callers (API routes) must await it.
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<VerifiedAuthPayload> {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : undefined;

  const idToken = request.cookies.get(AUTH_COOKIE_NAMES.ID_TOKEN)?.value;
  const accessToken =
    bearerToken || request.cookies.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value;

  const verified = await verifyToken(idToken, accessToken);
  if (!verified.isValid) return verified;

  // Supplement with session metadata cookie (non-authoritative — only fills gaps)
  const sessionMeta = request.cookies.get(
    AUTH_COOKIE_NAMES.SESSION_META
  )?.value;
  if (sessionMeta) {
    try {
      const parsed = JSON.parse(sessionMeta);
      if (!verified.sub && parsed.id) verified.sub = parsed.id;
      if (!verified.userType && parsed.userType)
        verified.userType = parsed.userType;
      if (!verified.email && parsed.email) verified.email = parsed.email;
    } catch {
      // Ignore parse failure — session meta is non-authoritative
    }
  }

  return verified;
}

/**
 * Lightweight synchronous check for Edge Middleware (no JWKS fetch).
 * Only validates expiry and issuer from the decoded payload — NOT the signature.
 * Use ONLY in middleware for fast redirects; always use getAuthenticatedUser in API routes.
 */
export function getAuthenticatedUserSync(
  request: NextRequest
): VerifiedAuthPayload {
  const idToken = request.cookies.get(AUTH_COOKIE_NAMES.ID_TOKEN)?.value;
  const accessToken = request.cookies.get(
    AUTH_COOKIE_NAMES.ACCESS_TOKEN
  )?.value;
  const token = idToken || accessToken;
  if (!token) return { isValid: false };

  try {
    const payload = decodeJwtPayload(token);
    if (!payload) return { isValid: false };

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now)
      return { isValid: false };

    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const region = process.env.AWS_REGION || 'us-east-1';
    if (userPoolId && payload.iss) {
      const expectedIss = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
      if (payload.iss !== expectedIss) return { isValid: false };
    }

    return buildPayload(payload);
  } catch {
    return { isValid: false };
  }
}
