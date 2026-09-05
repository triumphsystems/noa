// Bedrock Service Wrapper
// This module delegates to bedrock-nova.ts and voice-service.ts which use AWS Nova models
// Maintained for backwards compatibility

export {
  generateClinicalInsights,
  generateSOAPWithNova as generateSOAPNote,
  generatePatientSummary,
} from './bedrock-nova';
export { transcribeAudio } from './voice-service';
