import { NextRequest, NextResponse } from 'next/server'
import { createIntake, getIntakesByPatient } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, doctorId, medicalHistory, medications, allergies, surgeries, familyHistory, socialHistory } = body

    if (!patientId || !doctorId) {
      return NextResponse.json(
        { error: 'patientId and doctorId are required' },
        { status: 400 }
      )
    }

    // Create intake in DynamoDB
    const intake = await createIntake({
      patientId,
      doctorId,
      medicalHistory: medicalHistory || '',
      medications: medications || [],
      allergies: allergies || [],
      surgeries: surgeries || '',
      familyHistory: familyHistory || '',
      socialHistory: socialHistory || '',
      completed: true,
      completedAt: Date.now(),
    })

    return NextResponse.json({
      success: true,
      intake,
      message: 'Intake form submitted successfully',
    })
  } catch (error) {
    console.error('[v0] Error saving intake:', error)
    return NextResponse.json(
      { error: 'Failed to submit intake form', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      )
    }

    const intakes = await getIntakesByPatient(patientId)

    return NextResponse.json({
      success: true,
      intakes,
    })
  } catch (error) {
    console.error('[v0] Error fetching intakes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intakes', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
