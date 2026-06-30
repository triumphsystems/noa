// Re-export types and utilities from focused modules
export type {
  VoiceMessage,
  VoiceSessionState,
  IntakeConversationMessage,
  IntakeConversationDraft,
  IntakeConversationResult,
} from './voice-types'

export { saveAudioToS3 } from './bedrock-client'

export { generateIntakeConversationTurn } from './intake-conversation'

export {
  generateRealTimeNotes,
  getClinicaSuggestions,
  analyzeSessionSentiment,
  processVoiceInput,
} from './clinical-analysis'

// Legacy: Transcribe function (placeholder)
export async function transcribeAudio(audioBuffer: Buffer, sessionId: string): Promise<string> {
  console.log('[v0] Transcribing audio for session:', sessionId)
  return 'Audio transcribed - AWS Transcribe Medical integration pending'
}
