import { NextRequest, NextResponse } from 'next/server';
import { createIntake, getIntakesByPatient } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAMES } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    const hasRefreshToken = Boolean(
      request.cookies.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value
    );

    // If an authenticated session has expired, trigger client HTTP auto-refresh via 401
    if (!auth.isValid && hasRefreshToken) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId: requestedPatientId,
      doctorId,
      chiefComplaint,
      summary,
      medicalHistory,
      medications,
      allergies,
      surgeries,
      familyHistory,
      socialHistory,
    } = body;

    const patientId =
      auth.isValid && auth.userType === 'patient' && auth.sub
        ? auth.sub
        : requestedPatientId || `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (!doctorId) {
      return NextResponse.json(
        { error: 'doctorId is required' },
        { status: 400 }
      );
    }

    if (auth.isValid && auth.userType === 'patient' && requestedPatientId && requestedPatientId !== auth.sub) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot submit intake for another patient' },
        { status: 403 }
      );
    }

    // Create intake in DynamoDB
    const intake = await createIntake({
      patientId,
      doctorId,
      chiefComplaint: chiefComplaint || summary || '',
      summary: summary || chiefComplaint || '',
      medicalHistory: medicalHistory || '',
      medications: medications || [],
      allergies: allergies || [],
      surgeries: surgeries || '',
      familyHistory: familyHistory || '',
      socialHistory: socialHistory || '',
      completed: true,
      completedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      intake,
      message: 'Intake form submitted successfully',
    });
  } catch (error) {
    console.error('[Intakes] Error saving intake:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit intake form',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = request.nextUrl.searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      );
    }

    if (auth.userType === 'patient' && patientId !== auth.sub) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot view another patient intake' },
        { status: 403 }
      );
    }

    const intakes = await getIntakesByPatient(patientId);

    return NextResponse.json({
      success: true,
      intakes,
    });
  } catch (error) {
    console.error('Error fetching intakes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch intakes',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
