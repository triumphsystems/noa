import { NextRequest, NextResponse } from 'next/server'
import { getDoctorByEmail } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, userType } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (userType === 'doctor') {
      // Look up doctor in DynamoDB
      const doctor = await getDoctorByEmail(email)

      if (!doctor) {
        return NextResponse.json(
          { message: 'Doctor account not found' },
          { status: 401 }
        )
      }

      // In production, verify password hash against stored hash
      // For now, we assume password verification would happen with AWS Cognito
      
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: doctor.id,
          email: doctor.email,
          name: doctor.name,
          type: 'doctor',
        },
        tokens: {
          accessToken: `token-${doctor.id}`,
          idToken: `id-${doctor.id}`,
          refreshToken: `refresh-${doctor.id}`,
        },
      })
    }

    return NextResponse.json(
      { message: 'Invalid user type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { message: 'Login failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
