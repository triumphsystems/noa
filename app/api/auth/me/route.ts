import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAMES } from '@/lib/auth/cookies'
import { getCognitoUser } from '@/lib/auth/cognito'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value
    const sessionMeta = request.cookies.get(AUTH_COOKIE_NAMES.SESSION_META)?.value

    // Token MUST be present for authentication
    if (!accessToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // 3. Cryptographically verify token with Cognito
    const user = await getCognitoUser(accessToken)
    if (user) {
      // Optional enhancement: if sessionMeta matches verified sub, use cached display name
      let displayName = user.name
      if (sessionMeta) {
        try {
          const parsed = JSON.parse(sessionMeta)
          if (parsed.id === user.sub && parsed.name) {
            displayName = parsed.name
          }
        } catch {
          // Ignore parse errors
        }
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.sub,
          email: user.email,
          name: displayName,
          userType: user.userType,
        },
      })
    }

    return NextResponse.json({ authenticated: false }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
