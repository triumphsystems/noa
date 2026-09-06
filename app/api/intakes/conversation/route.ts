import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAMES } from '@/lib/auth/cookies';
import {
  createIntake,
  getDoctorByCareCode,
  getDoctorById,
  getPatientById,
  getPatientByEmail,
  getIntakesByPatient,
  type Patient,
} from '@/lib/db';
import {
  generateIntakeConversationTurn,
  type IntakeConversationDraft,
  type IntakeConversationMessage,
} from '@/lib/voice-service';

function mergeStringArrays(existing: string[] = [], incoming: string[] = []) {
  return Array.from(
    new Set(
      [...existing, ...incoming].map((item) => item.trim()).filter(Boolean)
    )
  );
}

/**
 * Build prefilled draft from DynamoDB Patient record and previous intakes
 */
function buildPrefillFromPatient(
  patient: Patient,
  pastAllergies: string[] = [],
  pastMedications: string[] = [],
  pastConditions: string[] = [],
  pastSurgeries: string = '',
  pastFamilyHistory: string = ''
): IntakeConversationDraft {
  return {
    firstName: patient.firstName || '',
    lastName: patient.lastName || '',
    dateOfBirth: patient.dateOfBirth || '',
    gender: patient.gender || '',
    email: patient.email || '',
    phone: patient.phone || '',
    address: patient.address || '',
    medicalConditions: mergeStringArrays(patient.conditions, pastConditions),
    allergies: mergeStringArrays(patient.allergies, pastAllergies),
    currentMedications: mergeStringArrays(patient.medications, pastMedications),
    surgeries: pastSurgeries,
    familyHistory: pastFamilyHistory,
    smokingStatus: '',
    alcoholUse: '',
    exerciseFrequency: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    consentRead: false,
  };
}

/**
 * GET /api/intakes/conversation
 * Smart pre-population endpoint: retrieves known patient details from DynamoDB
 * if the user is authenticated, allowing the voice assistant to skip questions
 * for details already on file.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    const hasRefreshToken = Boolean(
      request.cookies.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value
    );

    // If credentials were provided but expired, and a refresh token exists,
    // return 401 so the client-side http wrapper transparently refreshes tokens.
    if (!auth.isValid && hasRefreshToken) {
      return NextResponse.json({ message: 'Session expired' }, { status: 401 });
    }

    const requestedPatientId = request.nextUrl.searchParams.get('patientId');
    const requestedDoctorId =
      request.nextUrl.searchParams.get('doctorId') ||
      request.nextUrl.searchParams.get('doctorCode');

    // Resolve patient record from authentication or query param
    let patient: Patient | null = null;
    const patientId =
      auth.isValid && auth.userType === 'patient'
        ? auth.sub
        : requestedPatientId || null;

    if (patientId) {
      patient = await getPatientById(patientId);
    }
    if (!patient && auth.isValid && auth.email) {
      patient = await getPatientByEmail(auth.email);
    }

    if (patient) {
      const pastIntakes = await getIntakesByPatient(patient.id);
      const latestIntake = pastIntakes[0];

      const draft = buildPrefillFromPatient(
        patient,
        latestIntake?.allergies,
        latestIntake?.medications,
        latestIntake?.medicalHistory ? [latestIntake.medicalHistory] : [],
        latestIntake?.surgeries,
        latestIntake?.familyHistory
      );

      const name = [patient.firstName, patient.lastName]
        .filter(Boolean)
        .join(' ');
      const greeting = name
        ? `Welcome back, ${patient.firstName}! I have your profile and records on file. What symptoms or medical concerns bring you in today?`
        : `Welcome back! I've loaded your health records. What symptoms or concerns would you like to discuss today?`;

      return NextResponse.json({
        success: true,
        authenticated: true,
        patientId: patient.id,
        doctorId: requestedDoctorId || patient.doctorId || null,
        draft,
        initialPrompt: greeting,
      });
    }

    // Public / guest intake fallback
    return NextResponse.json({
      success: true,
      authenticated: false,
      patientId: null,
      doctorId: requestedDoctorId || null,
      draft: {},
      initialPrompt:
        "Hi, I'm Noa. I'll ask you one short question at a time. You can answer naturally in any language. Let's get started — what's your full name?",
    });
  } catch (error) {
    console.error('[Intake/Conversation] Error loading prefill data:', error);
    return NextResponse.json(
      {
        message: 'Failed to prefill intake data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    const hasRefreshToken = Boolean(
      request.cookies.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value
    );

    // If an authenticated session has expired, trigger client HTTP auto-refresh via 401
    if (!auth.isValid && hasRefreshToken) {
      return NextResponse.json({ message: 'Session expired' }, { status: 401 });
    }

    const body = await request.json();
    const transcript =
      typeof body.transcript === 'string' ? body.transcript.trim() : '';
    const language =
      typeof body.language === 'string' && body.language
        ? body.language
        : 'English';
    const history = Array.isArray(body.history)
      ? (body.history as IntakeConversationMessage[])
      : [];
    const incomingDraft = (body.draft || {}) as IntakeConversationDraft;
    const doctorInput =
      typeof body.doctorId === 'string' ? body.doctorId.trim() : '';
    let patientId =
      auth.isValid && auth.userType === 'patient' && auth.sub
        ? auth.sub
        : typeof body.patientId === 'string'
          ? body.patientId.trim()
          : '';

    if (!transcript) {
      return NextResponse.json(
        { message: 'transcript is required' },
        { status: 400 }
      );
    }

    // Smart Intake: If patient exists in DynamoDB, prefill any known fields not yet in draft
    let patient: Patient | null = null;
    if (patientId) {
      patient = await getPatientById(patientId);
    }
    if (!patient && auth.isValid && auth.email) {
      patient = await getPatientByEmail(auth.email);
      if (patient) patientId = patient.id;
    }

    let enrichedDraft: IntakeConversationDraft = { ...incomingDraft };
    if (patient) {
      enrichedDraft = {
        ...incomingDraft,
        firstName: incomingDraft.firstName || patient.firstName || '',
        lastName: incomingDraft.lastName || patient.lastName || '',
        dateOfBirth: incomingDraft.dateOfBirth || patient.dateOfBirth || '',
        gender: incomingDraft.gender || patient.gender || '',
        email: incomingDraft.email || patient.email || '',
        phone: incomingDraft.phone || patient.phone || '',
        address: incomingDraft.address || patient.address || '',
        allergies: mergeStringArrays(patient.allergies, incomingDraft.allergies),
        currentMedications: mergeStringArrays(
          patient.medications,
          incomingDraft.currentMedications
        ),
        medicalConditions: mergeStringArrays(
          patient.conditions,
          incomingDraft.medicalConditions
        ),
      };
    }

    const result = await generateIntakeConversationTurn({
      transcript,
      language,
      history,
      draft: enrichedDraft,
    });

    let savedIntake = null;

    // Save completed intake to DynamoDB
    if (result.isComplete) {
      const finalPatientId =
        patientId || `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      let resolvedDoctorId = doctorInput || patient?.doctorId || 'doctor-general';
      if (doctorInput && !doctorInput.startsWith('doctor-')) {
        const doc = await getDoctorByCareCode(doctorInput);
        if (doc) resolvedDoctorId = doc.id;
      }

      try {
        savedIntake = await createIntake({
          patientId: finalPatientId,
          doctorId: resolvedDoctorId,
          chiefComplaint: result.summary,
          summary: result.summary,
          completed: true,
          completedAt: Date.now(),
          medicalHistory: [
            result.draft.medicalConditions?.length
              ? `Conditions: ${result.draft.medicalConditions.join(', ')}`
              : '',
            result.draft.familyHistory
              ? `Family history: ${result.draft.familyHistory}`
              : '',
            result.draft.surgeries ? `Surgeries: ${result.draft.surgeries}` : '',
            result.draft.smokingStatus
              ? `Smoking: ${result.draft.smokingStatus}`
              : '',
            result.draft.alcoholUse ? `Alcohol: ${result.draft.alcoholUse}` : '',
            result.draft.exerciseFrequency
              ? `Exercise: ${result.draft.exerciseFrequency}`
              : '',
          ]
            .filter(Boolean)
            .join(' | '),
          medications: result.draft.currentMedications || [],
          allergies: result.draft.allergies || [],
          surgeries: result.draft.surgeries || '',
          familyHistory: result.draft.familyHistory || '',
          socialHistory: [
            result.draft.smokingStatus
              ? `Smoking: ${result.draft.smokingStatus}`
              : '',
            result.draft.alcoholUse ? `Alcohol: ${result.draft.alcoholUse}` : '',
            result.draft.exerciseFrequency
              ? `Exercise: ${result.draft.exerciseFrequency}`
              : '',
            result.draft.address ? `Address: ${result.draft.address}` : '',
            result.draft.emergencyContactName
              ? `Emergency contact: ${result.draft.emergencyContactName}`
              : '',
          ]
            .filter(Boolean)
            .join(' | '),
        });
      } catch (saveError) {
        console.error('[Intake/Conversation] Error saving intake on completion:', saveError);
      }
    }

    const responseDraft = {
      ...enrichedDraft,
      ...result.draft,
      medicalConditions: mergeStringArrays(
        enrichedDraft.medicalConditions,
        result.draft.medicalConditions
      ),
      allergies: mergeStringArrays(
        enrichedDraft.allergies,
        result.draft.allergies
      ),
      currentMedications: mergeStringArrays(
        enrichedDraft.currentMedications,
        result.draft.currentMedications
      ),
    };

    return NextResponse.json({
      success: true,
      turn: {
        assistantMessage: result.assistantMessage,
        detectedLanguage: result.detectedLanguage,
        normalizedTranscript: result.normalizedTranscript,
        draft: responseDraft,
        missingFields: result.missingFields,
        isComplete: result.isComplete,
        summary: result.summary,
      },
      savedIntake,
    });
  } catch (error) {
    console.error('Error handling intake conversation:', error);
    return NextResponse.json(
      {
        message: 'Failed to process intake conversation',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
