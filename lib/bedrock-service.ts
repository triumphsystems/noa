// Bedrock Service Wrapper
// This module now delegates to bedrock-nova.ts which uses AWS Nova models
// Maintained for backwards compatibility

export { generateClinicalInsights, generateSOAPWithNova as generateSOAPNote, generatePatientSummary } from './bedrock-nova'

/**
 * Mock transcription - in production use AWS Transcribe Medical
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  console.log('[v0] Audio transcription - would use AWS Transcribe Medical service')
  // In production: 
  // - Use AWS Transcribe Medical API
  // - Support medical-specific vocabulary
  // - Return timestamped transcript with speaker identification
  return 'Mock transcription: Patient reports normal symptoms. No concerns raised.'
}
