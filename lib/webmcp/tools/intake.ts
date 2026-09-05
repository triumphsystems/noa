/**
 * Voice Intake Tools for WebMCP
 * Exposes conversational voice intake processing and audio transcription functions.
 */

import { WebMCPRegistry } from '../core/registry';
import {
  generateIntakeConversationTurn,
  transcribeAudio,
} from '@/lib/voice-service';

export function registerIntakeTools(registry: WebMCPRegistry): void {
  // 1. process_intake_turn
  registry.registerTool(
    {
      name: 'process_intake_turn',
      description:
        'Processes a conversational medical intake turn: parses user response, extracts demographic/clinical fields, detects language, and determines next question or completion.',
      inputSchema: {
        type: 'object',
        properties: {
          transcript: {
            type: 'string',
            description:
              'The user speech transcript from the latest intake turn.',
          },
          language: {
            type: 'string',
            description:
              'The preferred language code or name (e.g. English, Spanish, French). Default: English.',
          },
          history: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: {
                  type: 'string',
                  enum: ['assistant', 'patient', 'system'],
                },
                content: { type: 'string' },
                timestamp: { type: 'number' },
              },
              required: ['role', 'content'],
            },
            description:
              'Previous messages exchanged in the intake conversation.',
          },
          draft: {
            type: 'object',
            description:
              'Current accumulated intake draft (demographics, medications, allergies, conditions).',
          },
        },
        required: ['transcript'],
      },
    },
    async (input) => {
      const {
        transcript,
        language = 'English',
        history = [],
        draft = {},
      } = input;
      if (!transcript) throw new Error('Missing required argument: transcript');
      return await generateIntakeConversationTurn({
        transcript,
        language,
        history,
        draft,
      });
    }
  );

  // 2. transcribe_consultation_audio
  registry.registerTool(
    {
      name: 'transcribe_consultation_audio',
      description:
        'Transcribes consultation audio data for a given session ID (AWS Transcribe Medical integration).',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description:
              'The consultation session ID associated with this recording.',
          },
          audioBase64: {
            type: 'string',
            description: 'Base64-encoded audio data (WAV/PCM/MP3).',
          },
        },
        required: ['sessionId', 'audioBase64'],
      },
    },
    async (input) => {
      const { sessionId, audioBase64 } = input;
      if (!sessionId) throw new Error('Missing required argument: sessionId');
      if (!audioBase64)
        throw new Error('Missing required argument: audioBase64');

      const buffer = Buffer.from(audioBase64, 'base64');
      const transcript = await transcribeAudio(buffer, sessionId);
      return { sessionId, transcript };
    }
  );
}
