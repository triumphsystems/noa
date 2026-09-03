import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAMES } from '@/lib/auth/cookies'
import { getCognitoUser } from '@/lib/auth/cognito'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value
    const sessionMeta = request.cookies.get(AUTH_COOKIE_NAMES.SESSION_META)?.value

    if (!accessToken && !sessionMeta) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Try parsing fast session metadata cookie
    if (sessionMeta) {
      try {
        const user = JSON.parse(sessionMeta)
        return NextResponse.json({
          authenticated: true,
          user,
        })
      } catch {
        // Fallback to token lookup
      }
    }

    // Verify token with Cognito if needed
    if (accessToken) {
      const user = await getCognitoUser(accessToken)
      if (user) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: user.sub,
            email: user.email,
            name: user.name,
            userType: user.userType,
          },
        })
      }
    }

    return NextResponse.json({ authenticated: false }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
