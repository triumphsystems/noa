import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { resolveUserProfile } from '@/lib/auth/profile';

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's identity.
 * Used by AuthContext on mount to verify the server-side session and hydrate the client.
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuth(request);
    if (!guard.ok) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { auth } = guard;
    const profile = await resolveUserProfile(auth.sub, auth.userType, {
      email: auth.email || '',
      name: '',
    });

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('[Auth/Me] Error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
