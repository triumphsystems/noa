import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAMES } from '@/lib/auth/cookies';
import {
  createIntake,
  updateIntake,
  getIntakeById,
  getDoctorByCareCode,
  getDoctorById,
  getPatientById,
  getPatientByEmail,
  getIntakesByPatient,
  type Patient,
  type PatientIntake,
} from '@/lib/db';
import {
  generateIntakeConversationTurn,
  generateIntakeGreeting,
  getMissingFields,
  getPopulatedFields,
  type IntakeConversationDraft,
  type IntakeConversationMessage,
} from '@/lib/voice-service';

export const dynamic = 'force-dynamic';

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

    const requestedDoctorId =
      request.nextUrl.searchParams.get('doctorId') ||
      request.nextUrl.searchParams.get('doctorCode');
    const requestedPatientId =
      request.nextUrl.searchParams.get('patientId') ||
      request.nextUrl.searchParams.get('patient');
    const requestedIntakeId = request.nextUrl.searchParams.get('intakeId');

    // SECURITY: Pre-filling existing patient data from DynamoDB MUST ONLY occur
    // for verified authenticated sessions (matching auth.sub) or an authorized doctor.
    // Unauthenticated public requests MUST NEVER be permitted to query arbitrary patient records.
    let patient: Patient | null = null;

    if (auth.isValid) {
      if (auth.userType === 'patient' && auth.sub) {
        patient = await getPatientById(auth.sub);
        if (!patient && auth.email) {
          patient = await getPatientByEmail(auth.email);
        }
      } else if (auth.userType === 'doctor' && requestedPatientId) {
        patient = await getPatientById(requestedPatientId);
      }
    }

    let existingIntake: PatientIntake | null = null;
    if (requestedIntakeId) {
      const candidateIntake = await getIntakeById(requestedIntakeId);
      // Security: Only allow intake access if:
      // 1. Authenticated patient owns it (auth.sub === candidateIntake.patientId)
      // 2. Authenticated doctor is reviewing it (auth.userType === 'doctor')
      // 3. Unauthenticated caller owns an in-progress anonymous guest intake (starts with guest- and not completed)
      const isOwner =
        auth.isValid &&
        Boolean(auth.sub) &&
        candidateIntake?.patientId === auth.sub;
      const isDoctor = auth.isValid && auth.userType === 'doctor';
      const isAnonymousGuest =
        !auth.isValid &&
        Boolean(candidateIntake?.patientId?.startsWith('guest-')) &&
        !candidateIntake?.completed;

      if (candidateIntake && (isOwner || isDoctor || isAnonymousGuest)) {
        existingIntake = candidateIntake;
      }
    }

    if (patient) {
      const pastIntakes = await getIntakesByPatient(patient.id);
      const activeOrLatestIntake =
        existingIntake ||
        pastIntakes.find((i) => !i.completed) ||
        pastIntakes[0];

      let draft = buildPrefillFromPatient(
        patient,
        activeOrLatestIntake?.allergies,
        activeOrLatestIntake?.medications,
        activeOrLatestIntake?.medicalHistory
          ? [activeOrLatestIntake.medicalHistory]
          : [],
        activeOrLatestIntake?.surgeries,
        activeOrLatestIntake?.familyHistory
      );

      // If active draft had saved in-progress fields on DynamoDB intake item
      if (
        activeOrLatestIntake?.draft &&
        typeof activeOrLatestIntake.draft === 'object'
      ) {
        draft = {
          ...draft,
          ...(activeOrLatestIntake.draft as unknown as IntakeConversationDraft),
        };
      }

      if (activeOrLatestIntake?.chiefComplaint && !draft.chiefComplaint) {
        draft.chiefComplaint = activeOrLatestIntake.chiefComplaint;
      }

      const patientName = [patient.firstName, patient.lastName]
        .filter(Boolean)
        .join(' ');
      const greeting = generateIntakeGreeting(draft, patientName);
      const missingFields = getMissingFields(draft);

      return NextResponse.json({
        success: true,
        authenticated: true,
        patientId: patient.id,
        doctorId:
          requestedDoctorId ||
          activeOrLatestIntake?.doctorId ||
          patient.doctorId ||
          null,
        intakeId: activeOrLatestIntake?.id || null,
        draft,
        missingFields,
        initialPrompt: greeting,
      });
    }

    // Guest with active in-progress intake in DynamoDB
    if (existingIntake) {
      let draft: IntakeConversationDraft = {};
      if (existingIntake.draft && typeof existingIntake.draft === 'object') {
        draft = existingIntake.draft as unknown as IntakeConversationDraft;
      }
      if (existingIntake.chiefComplaint && !draft.chiefComplaint) {
        draft.chiefComplaint = existingIntake.chiefComplaint;
      }

      const greeting = generateIntakeGreeting(draft);
      const missingFields = getMissingFields(draft);

      return NextResponse.json({
        success: true,
        authenticated: false,
        patientId: existingIntake.patientId || null,
        doctorId: requestedDoctorId || existingIntake.doctorId || null,
        intakeId: existingIntake.id,
        draft,
        missingFields,
        initialPrompt: greeting,
      });
    }

    // Public / new guest intake fallback
    return NextResponse.json({
      success: true,
      authenticated: false,
      patientId: null,
      doctorId: requestedDoctorId || null,
      intakeId: null,
      draft: {},
      missingFields: getMissingFields(),
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
    const incomingIntakeId =
      typeof body.intakeId === 'string' ? body.intakeId.trim() : '';
    if (!transcript) {
      return NextResponse.json(
        { message: 'transcript is required' },
        { status: 400 }
      );
    }

    // SECURITY: Pre-filling known patient data from DynamoDB MUST ONLY occur
    // for verified authenticated sessions matching auth.sub.
    // Unauthenticated public requests MUST NEVER be permitted to query arbitrary patient records.
    let patient: Patient | null = null;
    let patientId = '';

    if (auth.isValid && auth.userType === 'patient' && auth.sub) {
      patientId = auth.sub;
      patient = await getPatientById(patientId);
      if (!patient && auth.email) {
        patient = await getPatientByEmail(auth.email);
        if (patient) patientId = patient.id;
      }
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
        allergies: mergeStringArrays(
          patient.allergies,
          incomingDraft.allergies
        ),
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

    let savedIntake = null;
    let effectiveIntakeId = incomingIntakeId;

    const finalPatientId =
      patientId ||
      `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    let resolvedDoctorId = doctorInput || patient?.doctorId || 'doctor-general';
    if (doctorInput && !doctorInput.startsWith('doctor-')) {
      const doc = await getDoctorByCareCode(doctorInput);
      if (doc) resolvedDoctorId = doc.id;
    }

    // Ensure completion strictly requires all clinical fields to be resolved
    const finalMissingFields = getMissingFields(responseDraft);
    const strictlyComplete = Boolean(
      result.isComplete && finalMissingFields.length === 0
    );

    // Finalized clinical records (completed: true) NEVER expire and are permanently retained (HIPAA).
    const DRAFT_TTL_SECONDS = 48 * 60 * 60; // 48 hours
    const draftTtl = strictlyComplete
      ? null // REMOVE ttl attribute in DynamoDB upon completion
      : Math.floor(Date.now() / 1000) + DRAFT_TTL_SECONDS;

    const intakePayload = {
      patientId: finalPatientId,
      doctorId: resolvedDoctorId,
      chiefComplaint:
        result.summary ||
        responseDraft.chiefComplaint ||
        responseDraft.medicalConditions?.[0] ||
        'Clinical intake in progress',
      summary: result.summary || 'Clinical intake in progress',
      completed: strictlyComplete,
      completedAt: strictlyComplete ? Date.now() : undefined,
      ttl: draftTtl,
      medicalHistory: [
        responseDraft.medicalConditions?.length
          ? `Conditions: ${responseDraft.medicalConditions.join(', ')}`
          : '',
        responseDraft.familyHistory
          ? `Family history: ${responseDraft.familyHistory}`
          : '',
        responseDraft.surgeries ? `Surgeries: ${responseDraft.surgeries}` : '',
        responseDraft.smokingStatus
          ? `Smoking: ${responseDraft.smokingStatus}`
          : '',
        responseDraft.alcoholUse ? `Alcohol: ${responseDraft.alcoholUse}` : '',
        responseDraft.exerciseFrequency
          ? `Exercise: ${responseDraft.exerciseFrequency}`
          : '',
      ]
        .filter(Boolean)
        .join(' | '),
      medications: responseDraft.currentMedications || [],
      allergies: responseDraft.allergies || [],
      surgeries: responseDraft.surgeries || '',
      familyHistory: responseDraft.familyHistory || '',
      socialHistory: [
        responseDraft.smokingStatus
          ? `Smoking: ${responseDraft.smokingStatus}`
          : '',
        responseDraft.alcoholUse ? `Alcohol: ${responseDraft.alcoholUse}` : '',
        responseDraft.exerciseFrequency
          ? `Exercise: ${responseDraft.exerciseFrequency}`
          : '',
        responseDraft.address ? `Address: ${responseDraft.address}` : '',
        responseDraft.emergencyContactName
          ? `Emergency contact: ${responseDraft.emergencyContactName}`
          : '',
      ]
        .filter(Boolean)
        .join(' | '),
      draft: responseDraft as Record<string, unknown>,
    };

    if (effectiveIntakeId) {
      try {
        savedIntake = await updateIntake(effectiveIntakeId, intakePayload);
      } catch (updateErr) {
        console.warn(
          '[Intake/Conversation] updateIntake failed, attempting create:',
          updateErr
        );
      }
    }

    if (!savedIntake) {
      try {
        savedIntake = await createIntake(intakePayload);
        if (savedIntake?.id) {
          effectiveIntakeId = savedIntake.id;
        }
      } catch (saveError) {
        console.error(
          '[Intake/Conversation] Error persisting intake:',
          saveError
        );
      }
    }

    return NextResponse.json({
      success: true,
      turn: {
        assistantMessage: result.assistantMessage,
        detectedLanguage: result.detectedLanguage,
        normalizedTranscript: result.normalizedTranscript,
        draft: responseDraft,
        missingFields: finalMissingFields,
        isComplete: strictlyComplete,
        summary: result.summary,
      },
      patientId: finalPatientId,
      intakeId: effectiveIntakeId || savedIntake?.id || null,
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
