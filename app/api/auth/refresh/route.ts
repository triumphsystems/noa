import { NextRequest, NextResponse } from 'next/server'
import { refreshCognitoTokens, getCognitoUser, getCognitoConfig } from '@/lib/auth/cognito'
import { AUTH_COOKIE_NAMES, setAuthCookies, clearAuthCookies } from '@/lib/auth/cookies'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value
    const sessionMeta = request.cookies.get(AUTH_COOKIE_NAMES.SESSION_META)?.value

    if (!refreshToken) {
      const response = NextResponse.json(
        { message: 'No refresh token present' },
        { status: 401 }
      )
      return clearAuthCookies(response)
    }

    const { isConfigured } = getCognitoConfig()
    if (!isConfigured) {
      return NextResponse.json(
        { message: 'Authentication service is not configured' },
        { status: 503 }
      )
    }

    // Exchange refresh token with AWS Cognito for fresh access and ID tokens
    const tokens = await refreshCognitoTokens(refreshToken)
    const cognitoUser = await getCognitoUser(tokens.accessToken)

    const userId = cognitoUser?.sub || 'user'
    const userName = cognitoUser?.name || 'User'
    // userType comes exclusively from Cognito — session cookie is non-authoritative
    const userType: 'doctor' | 'patient' | 'admin' = cognitoUser?.userType || 'doctor'

    // Session metadata cookie supplements display name if Cognito doesn't have it
    // but NEVER overrides the userType from the verified token
    let displayName = userName
    if (!displayName || displayName === 'User') {
      const sessionMeta = request.cookies.get(AUTH_COOKIE_NAMES.SESSION_META)?.value
      if (sessionMeta) {
        try {
          const parsed = JSON.parse(sessionMeta)
          if (parsed.name) displayName = parsed.name
        } catch {}
      }
    }

    const sessionUser = {
      id: userId,
      email: cognitoUser?.email || '',
      name: displayName,
      userType,
    }

    const response = NextResponse.json({
      success: true,
      message: 'Tokens refreshed successfully',
      user: sessionUser,
    })

    return setAuthCookies(response, tokens, {
      sub: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      userType: sessionUser.userType,
    })
  } catch (error: any) {
    console.error('[Auth] Token refresh error:', error?.message)
    const response = NextResponse.json(
      { message: error?.message || 'Failed to refresh authentication session' },
      { status: 401 }
    )
    return clearAuthCookies(response)
  }
}
