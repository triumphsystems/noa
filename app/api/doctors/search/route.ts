import { NextRequest, NextResponse } from 'next/server'
import { searchDoctors, getAllDoctors } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const q = request.nextUrl.searchParams.get('q')?.trim() || ''

    let doctors = []
    if (q) {
      doctors = await searchDoctors(q)
    } else {
      doctors = await getAllDoctors()
    }

    // Sanitize results to avoid exposing internal credentials
    const sanitized = doctors.map(doc => ({
      id: doc.id,
      name: doc.name,
      specialty: doc.specialty,
      clinic: doc.clinic,
      careCode: doc.careCode,
      email: doc.email,
      phone: doc.phone,
      avatar: doc.avatar,
    }))

    return NextResponse.json({
      success: true,
      data: sanitized,
    })
  } catch (error) {
    console.error('[API /doctors/search] Error searching doctors:', error)
    return NextResponse.json(
      {
        message: 'Failed to search doctors',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
