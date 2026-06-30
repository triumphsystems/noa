export interface VoiceMessage {
  role: 'doctor' | 'patient' | 'system'
  content: string
  timestamp: number
}

export interface VoiceSessionState {
  messages: VoiceMessage[]
  transcript: string
  recordingActive: boolean
  sessionId: string
}

export interface IntakeConversationMessage {
  role: 'assistant' | 'patient' | 'system'
  content: string
  timestamp: number
}

export interface IntakeConversationDraft {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  gender?: string
  email?: string
  phone?: string
  address?: string
  medicalConditions?: string[]
  surgeries?: string
  allergies?: string[]
  currentMedications?: string[]
  familyHistory?: string
  smokingStatus?: string
  alcoholUse?: string
  exerciseFrequency?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  consentRead?: boolean
}

export interface IntakeConversationResult {
  assistantMessage: string
  detectedLanguage: string
  normalizedTranscript: string
  draft: IntakeConversationDraft
  missingFields: string[]
  isComplete: boolean
  summary: string
}
