/**
 * Canonical WebMCP Tool Definitions
 * Shared static schemas for both server JSON-RPC and browser-native modelContext.
 * Allows instant synchronous registration without network latency or race conditions.
 */

import { ToolDefinition } from '../core/types'

export const CLINICAL_SERVER_TOOL_DEFINITIONS: ToolDefinition[] = [
  // 1. generate_soap_note
  {
    name: 'generate_soap_note',
    description:
      'Converts a medical consultation transcript into a structured clinical SOAP note (Subjective, Objective, Assessment, Plan) using AWS Nova.',
    inputSchema: {
      type: 'object',
      properties: {
        transcript: {
          type: 'string',
          description: 'The raw doctor-patient consultation transcript or conversation history.',
        },
        patientContext: {
          type: 'string',
          description: 'Optional clinical context, known past medical history, or patient demographics.',
        },
      },
      required: ['transcript'],
    },
  },

  // 2. generate_clinical_insights
  {
    name: 'generate_clinical_insights',
    description:
      'Analyzes patient medical history and current presentation to generate clinical considerations, differential diagnoses, and diagnostic recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        patientHistory: {
          type: 'string',
          description: 'Relevant past medical, surgical, family, and medication history.',
        },
        currentPresentation: {
          type: 'string',
          description: 'Current symptoms, chief complaint, and physical exam findings.',
        },
        previousFindings: {
          type: 'string',
          description: 'Optional previous lab results, imaging reports, or consultation notes.',
        },
      },
      required: ['patientHistory', 'currentPresentation'],
    },
  },

  // 3. generate_patient_summary
  {
    name: 'generate_patient_summary',
    description:
      'Converts complex clinical SOAP notes into an empathetic, easy-to-understand plain language patient summary.',
    inputSchema: {
      type: 'object',
      properties: {
        soapNote: {
          type: 'string',
          description: 'The complete clinical SOAP note text.',
        },
        clinicalTerms: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional specific medical terms to explain clearly in parentheses.',
        },
      },
      required: ['soapNote'],
    },
  },

  // 4. generate_triage_priority
  {
    name: 'generate_triage_priority',
    description:
      'Evaluates patient chief complaint and acute symptoms to assign an emergency triage priority (emergent, urgent, routine).',
    inputSchema: {
      type: 'object',
      properties: {
        chiefComplaint: {
          type: 'string',
          description: 'The primary symptom or reason the patient is seeking care.',
        },
        symptoms: {
          type: 'string',
          description: 'Associated symptoms, onset, duration, and severity.',
        },
        vitalSigns: {
          type: 'string',
          description: 'Optional recorded vital signs (BP, HR, RR, Temp, SpO2).',
        },
      },
      required: ['chiefComplaint', 'symptoms'],
    },
  },

  // 5. generate_care_plan
  {
    name: 'generate_care_plan',
    description:
      'Generates a comprehensive clinical follow-up care plan including appointment cadence, monitoring parameters, and red-flag escalation instructions.',
    inputSchema: {
      type: 'object',
      properties: {
        assessment: {
          type: 'string',
          description: 'Clinical diagnosis or assessment summary.',
        },
        medications: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of prescribed or active medications.',
        },
        procedures: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional procedures performed or planned.',
        },
      },
      required: ['assessment', 'medications'],
    },
  },

  // 6. get_clinical_suggestions
  {
    name: 'get_clinical_suggestions',
    description:
      'Provides real-time clinical decision support suggestions and inquiry prompts for the attending doctor during an active consultation.',
    inputSchema: {
      type: 'object',
      properties: {
        transcript: {
          type: 'string',
          description: 'The recent consultation dialogue transcript.',
        },
        patientHistory: {
          type: 'string',
          description: 'Patient medical background.',
        },
        currentSymptoms: {
          type: 'string',
          description: 'Observed or reported symptoms.',
        },
      },
      required: ['transcript', 'patientHistory', 'currentSymptoms'],
    },
  },

  // 7. analyze_sentiment
  {
    name: 'analyze_sentiment',
    description:
      'Analyzes consultation dialogue for patient sentiment, distress levels, clinical urgency, and red-flag conversational markers.',
    inputSchema: {
      type: 'object',
      properties: {
        transcript: {
          type: 'string',
          description: 'The dialogue transcript to analyze.',
        },
      },
      required: ['transcript'],
    },
  },

  // 8. process_intake_turn
  {
    name: 'process_intake_turn',
    description:
      'Processes a conversational medical intake turn: parses user response, extracts demographic/clinical fields, detects language, and determines next question or completion.',
    inputSchema: {
      type: 'object',
      properties: {
        transcript: {
          type: 'string',
          description: 'The user speech transcript from the latest intake turn.',
        },
        language: {
          type: 'string',
          description: 'The preferred language code or name (e.g. English, Spanish, French). Default: English.',
        },
        history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['assistant', 'patient', 'system'] },
              content: { type: 'string' },
              timestamp: { type: 'number' },
            },
            required: ['role', 'content'],
          },
          description: 'Previous messages exchanged in the intake conversation.',
        },
        draft: {
          type: 'object',
          description: 'Current accumulated intake draft (demographics, medications, allergies, conditions).',
        },
      },
      required: ['transcript'],
    },
  },

  // 9. get_patient_by_id
  {
    name: 'get_patient_by_id',
    description:
      'Retrieves patient record including demographics, conditions, medications, and allergies by patient ID.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Unique identifier of the patient.' },
      },
      required: ['patientId'],
    },
  },

  // 10. list_doctor_patients
  {
    name: 'list_doctor_patients',
    description: 'Retrieves all registered patients associated with a specific doctor.',
    inputSchema: {
      type: 'object',
      properties: {
        doctorId: { type: 'string', description: 'Unique identifier of the doctor.' },
      },
      required: ['doctorId'],
    },
  },

  // 11. get_doctor_by_id
  {
    name: 'get_doctor_by_id',
    description: 'Retrieves a doctor profile by doctor ID.',
    inputSchema: {
      type: 'object',
      properties: {
        doctorId: { type: 'string', description: 'Unique identifier of the doctor.' },
      },
      required: ['doctorId'],
    },
  },

  // 12. get_session_by_id
  {
    name: 'get_session_by_id',
    description: 'Retrieves consultation session record by session ID.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Unique identifier of the consultation session.' },
      },
      required: ['sessionId'],
    },
  },

  // 13. list_doctor_sessions
  {
    name: 'list_doctor_sessions',
    description: 'Lists all consultation sessions conducted by a specific doctor.',
    inputSchema: {
      type: 'object',
      properties: {
        doctorId: { type: 'string', description: 'Doctor ID.' },
        limit: { type: 'number', description: 'Maximum sessions to return (default 20).' },
      },
      required: ['doctorId'],
    },
  },

  // 14. list_patient_sessions
  {
    name: 'list_patient_sessions',
    description: 'Lists all consultation sessions associated with a specific patient.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient ID.' },
      },
      required: ['patientId'],
    },
  },

  // 15. get_patient_intake
  {
    name: 'get_patient_intake',
    description: 'Retrieves completed intake questionnaire data for a patient.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient ID.' },
      },
      required: ['patientId'],
    },
  },
]
