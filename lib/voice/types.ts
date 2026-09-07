export interface VoiceMessage {
  role: 'doctor' | 'patient' | 'system';
  content: string;
  timestamp: number;
}

export interface VoiceSessionState {
  messages: VoiceMessage[];
  transcript: string;
  recordingActive: boolean;
  sessionId: string;
}

export interface IntakeConversationMessage {
  role: 'assistant' | 'patient' | 'system';
  content: string;
  timestamp: number;
}

export interface IntakeConversationDraft {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  medicalConditions?: string[];
  surgeries?: string;
  allergies?: string[];
  currentMedications?: string[];
  familyHistory?: string;
  smokingStatus?: string;
  alcoholUse?: string;
  exerciseFrequency?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  consentRead?: boolean;
  chiefComplaint?: string;
}

export interface IntakeConversationResult {
  assistantMessage: string;
  detectedLanguage: string;
  normalizedTranscript: string;
  draft: IntakeConversationDraft;
  missingFields: string[];
  isComplete: boolean;
  summary: string;
}

export const INITIAL_DRAFT: IntakeConversationDraft = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  email: '',
  phone: '',
  address: '',
  medicalConditions: [],
  surgeries: '',
  allergies: [],
  currentMedications: [],
  familyHistory: '',
  smokingStatus: '',
  alcoholUse: '',
  exerciseFrequency: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  consentRead: false,
  chiefComplaint: '',
};

export const DEFAULT_INITIAL_PROMPT =
  "Hi, I'm Noa. I'll ask you one short question at a time. You can answer naturally in any language. Let's get started — what's your full name?";

/**
 * Returns human-readable list of fields that are already captured in the draft
 */
export function getPopulatedFields(draft?: IntakeConversationDraft): string[] {
  if (!draft) return [];
  const populated: string[] = [];

  const fullName = [draft.firstName, draft.lastName].filter(Boolean).join(' ');
  if (fullName) populated.push(`Full Name (${fullName})`);
  if (draft.dateOfBirth) populated.push(`Date of Birth (${draft.dateOfBirth})`);
  if (draft.gender) populated.push(`Gender (${draft.gender})`);
  if (draft.email) populated.push(`Email (${draft.email})`);
  if (draft.phone) populated.push(`Phone (${draft.phone})`);
  if (draft.address) populated.push(`Address (${draft.address})`);
  if (draft.chiefComplaint) populated.push(`Reason for visit (${draft.chiefComplaint})`);
  if (draft.allergies && draft.allergies.length > 0) {
    populated.push(`Allergies (${draft.allergies.join(', ')})`);
  }
  if (draft.currentMedications && draft.currentMedications.length > 0) {
    populated.push(`Medications (${draft.currentMedications.join(', ')})`);
  }
  if (draft.medicalConditions && draft.medicalConditions.length > 0) {
    populated.push(`Medical Conditions (${draft.medicalConditions.join(', ')})`);
  }
  if (draft.surgeries) populated.push(`Surgeries (${draft.surgeries})`);
  if (draft.familyHistory) populated.push(`Family History (${draft.familyHistory})`);
  if (draft.smokingStatus) populated.push(`Smoking (${draft.smokingStatus})`);
  if (draft.alcoholUse) populated.push(`Alcohol (${draft.alcoholUse})`);
  if (draft.emergencyContactName) {
    populated.push(
      `Emergency Contact (${draft.emergencyContactName}${draft.emergencyContactPhone ? ` - ${draft.emergencyContactPhone}` : ''})`
    );
  }
  if (draft.consentRead) populated.push('Consent (Confirmed)');

  return populated;
}

/**
 * Identifies remaining clinical fields needed for intake completion
 */
export function getMissingFields(draft?: IntakeConversationDraft): string[] {
  if (!draft) {
    return [
      'full name',
      'date of birth',
      'symptoms or reason for visit',
      'allergies',
      'medications',
      'medical history',
      'emergency contact',
      'consent',
    ];
  }

  const missing: string[] = [];
  const hasName = Boolean(draft.firstName?.trim() && draft.lastName?.trim());
  if (!hasName) missing.push('full name');

  if (!draft.dateOfBirth?.trim()) missing.push('date of birth');
  if (!draft.chiefComplaint?.trim() && (!draft.medicalConditions || draft.medicalConditions.length === 0)) {
    missing.push('symptoms or reason for visit');
  }
  if (!draft.allergies || draft.allergies.length === 0) {
    missing.push('known allergies');
  }
  if (!draft.currentMedications || draft.currentMedications.length === 0) {
    missing.push('current medications');
  }
  if (!draft.emergencyContactName?.trim()) {
    missing.push('emergency contact');
  }
  if (!draft.consentRead) {
    missing.push('consent to submit');
  }

  return missing;
}
