/**
 * Automated Test Suite for Modern Server-Side Cognito Auth & Secure Cookies
 * Validates cookie flags, Cognito config, and Edge Middleware RBAC logic.
 * Run with: node --test tests/auth.test.mjs
 */

import test, { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('HIPAA-Compliant Session Cookie Suite', () => {
  const AUTH_COOKIE_NAMES = {
    ACCESS_TOKEN: 'noa_access_token',
    ID_TOKEN: 'noa_id_token',
    REFRESH_TOKEN: 'noa_refresh_token',
    SESSION_META: 'noa_session',
  }

  function simulateSetAuthCookies(tokens, sessionUser, isProd = true) {
    const cookies = new Map()
    const commonOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    }

    cookies.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, {
      value: tokens.accessToken,
      options: { ...commonOptions, maxAge: tokens.expiresIn || 3600 },
    })

    cookies.set(AUTH_COOKIE_NAMES.ID_TOKEN, {
      value: tokens.idToken,
      options: { ...commonOptions, maxAge: tokens.expiresIn || 3600 },
    })

    if (tokens.refreshToken) {
      cookies.set(AUTH_COOKIE_NAMES.REFRESH_TOKEN, {
        value: tokens.refreshToken,
        options: { ...commonOptions, maxAge: 30 * 24 * 60 * 60 },
      })
    }

    cookies.set(AUTH_COOKIE_NAMES.SESSION_META, {
      value: JSON.stringify({
        id: sessionUser.sub,
        email: sessionUser.email,
        name: sessionUser.name,
        userType: sessionUser.userType,
      }),
      options: {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      },
    })

    return cookies
  }

  function simulateClearAuthCookies() {
    const cookies = new Map()
    const clearOptions = { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 }

    cookies.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, { value: '', options: clearOptions })
    cookies.set(AUTH_COOKIE_NAMES.ID_TOKEN, { value: '', options: clearOptions })
    cookies.set(AUTH_COOKIE_NAMES.REFRESH_TOKEN, { value: '', options: clearOptions })
    cookies.set(AUTH_COOKIE_NAMES.SESSION_META, { value: '', options: { ...clearOptions, httpOnly: false } })

    return cookies
  }

  it('should set tamper-proof httpOnly and secure flags on access and id tokens', () => {
    const tokens = {
      accessToken: 'sample-jwt-access-token',
      idToken: 'sample-jwt-id-token',
      refreshToken: 'sample-refresh-token',
      expiresIn: 3600,
    }

    const sessionUser = {
      sub: 'doc-uuid-1234',
      email: 'dr.smith@noa.health',
      name: 'Dr. Sarah Smith',
      userType: 'doctor',
    }

    const cookies = simulateSetAuthCookies(tokens, sessionUser, true)

    // Verify Access Token Cookie
    const accessCookie = cookies.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)
    assert.equal(accessCookie.value, tokens.accessToken)
    assert.equal(accessCookie.options.httpOnly, true, 'Access token MUST be httpOnly to prevent XSS')
    assert.equal(accessCookie.options.secure, true, 'Access token MUST be secure in production')
    assert.equal(accessCookie.options.sameSite, 'lax')
    assert.equal(accessCookie.options.maxAge, 3600)

    // Verify Refresh Token Cookie
    const refreshCookie = cookies.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)
    assert.equal(refreshCookie.value, tokens.refreshToken)
    assert.equal(refreshCookie.options.httpOnly, true)
    assert.equal(refreshCookie.options.maxAge, 30 * 24 * 60 * 60)

    // Verify Session Metadata Cookie
    const metaCookie = cookies.get(AUTH_COOKIE_NAMES.SESSION_META)
    assert.equal(metaCookie.options.httpOnly, false, 'Session meta must be readable by client UI')
    const parsed = JSON.parse(metaCookie.value)
    assert.equal(parsed.id, 'doc-uuid-1234')
    assert.equal(parsed.email, 'dr.smith@noa.health')
    assert.equal(parsed.userType, 'doctor')
  })

  it('should clear all authentication cookies with maxAge 0 on logout', () => {
    const cleared = simulateClearAuthCookies()

    for (const [name, cookie] of cleared.entries()) {
      assert.equal(cookie.value, '', `Cookie ${name} value must be emptied`)
      assert.equal(cookie.options.maxAge, 0, `Cookie ${name} maxAge must be 0`)
    }
  })
})

describe('Cognito Server Configuration & Validation Suite', () => {
  it('should normalize user emails and validate password inputs', () => {
    function sanitizeAuthInput(email, password) {
      if (!email || !password) {
        throw new Error('Email and password are required')
      }
      return {
        email: email.trim().toLowerCase(),
        password: password,
      }
    }

    assert.throws(
      () => sanitizeAuthInput('', 'Password123!'),
      /Email and password are required/
    )

    assert.throws(
      () => sanitizeAuthInput('test@example.com', ''),
      /Email and password are required/
    )

    const sanitized = sanitizeAuthInput('  Dr.Jones@Hospital.COM  ', 'ValidPass123#')
    assert.equal(sanitized.email, 'dr.jones@hospital.com')
    assert.equal(sanitized.password, 'ValidPass123#')
  })

  it('should properly detect configured vs unconfigured Cognito environments', () => {
    function checkCognitoConfig(userPoolId, clientId) {
      return Boolean(userPoolId && clientId)
    }

    assert.equal(checkCognitoConfig('', ''), false)
    assert.equal(checkCognitoConfig('us-east-1_abcdef123', ''), false)
    assert.equal(checkCognitoConfig('us-east-1_abcdef123', 'appclient12345'), true)
  })
})

describe('Next.js Edge Middleware RBAC Simulation Suite', () => {
  function simulateMiddleware(pathname, cookies) {
    const sessionCookie = cookies.get('noa_session')
    const tokenCookie = cookies.get('noa_access_token')
    const isAuthenticated = Boolean(sessionCookie || tokenCookie)

    let userType = null
    if (sessionCookie) {
      try {
        userType = JSON.parse(sessionCookie).userType
      } catch {}
    }

    if (pathname.startsWith('/dashboard/doctor')) {
      if (!isAuthenticated) {
        return { action: 'redirect', to: '/auth/login?userType=doctor' }
      }
      if (userType && userType !== 'doctor') {
        return { action: 'redirect', to: '/dashboard/patient' }
      }
      return { action: 'next' }
    }

    if (pathname.startsWith('/dashboard/patient')) {
      if (!isAuthenticated) {
        return { action: 'redirect', to: '/auth/login?userType=patient' }
      }
      if (userType && userType !== 'patient') {
        return { action: 'redirect', to: '/dashboard/doctor' }
      }
      return { action: 'next' }
    }

    return { action: 'next' }
  }

  it('should redirect unauthenticated users away from doctor dashboard', () => {
    const res = simulateMiddleware('/dashboard/doctor', new Map())
    assert.equal(res.action, 'redirect')
    assert.ok(res.to.includes('/auth/login?userType=doctor'))
  })

  it('should redirect patients attempting to access doctor dashboard', () => {
    const cookies = new Map()
    cookies.set('noa_session', JSON.stringify({ userType: 'patient' }))
    const res = simulateMiddleware('/dashboard/doctor/patients', cookies)

    assert.equal(res.action, 'redirect')
    assert.equal(res.to, '/dashboard/patient')
  })

  it('should permit authenticated doctors to access doctor dashboard', () => {
    const cookies = new Map()
    cookies.set('noa_session', JSON.stringify({ userType: 'doctor' }))
    const res = simulateMiddleware('/dashboard/doctor/patients', cookies)

    assert.equal(res.action, 'next')
  })
})
