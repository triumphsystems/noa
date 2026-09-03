/**
 * Clinical AI Tools for WebMCP
 * Exposes AWS Bedrock Nova clinical intelligence functions.
 */

import { WebMCPRegistry } from '../core/registry'
import {
  generateSOAPWithNova,
  generateClinicalInsights,
  generatePatientSummary,
  generateTriagePriority,
  generateFollowUpPlan,
} from '@/lib/bedrock-nova'
import {
  getClinicaSuggestions,
  analyzeSessionSentiment,
} from '@/lib/voice-service'

export function registerClinicalTools(registry: WebMCPRegistry): void {
  // 1. generate_soap_note
  registry.registerTool(
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
    async (input) => {
      const { transcript, patientContext } = input
      if (!transcript) throw new Error('Missing required argument: transcript')
      return await generateSOAPWithNova(transcript, patientContext)
    }
  )

  // 2. generate_clinical_insights
  registry.registerTool(
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
    async (input) => {
      const { patientHistory, currentPresentation, previousFindings } = input
      if (!patientHistory) throw new Error('Missing required argument: patientHistory')
      if (!currentPresentation) throw new Error('Missing required argument: currentPresentation')
      const text = await generateClinicalInsights(patientHistory, currentPresentation, previousFindings)
      return { insights: text }
    }
  )

  // 3. generate_patient_summary
  registry.registerTool(
    {
      name: 'generate_patient_summary',
      description:
        'Converts a clinical SOAP note or doctor notes into a clear, empathetic, jargon-free summary for the patient.',
      inputSchema: {
        type: 'object',
        properties: {
          soapNote: {
            type: 'string',
            description: 'The clinical SOAP note or doctor assessment to translate into plain language.',
          },
          clinicalTerms: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional specific clinical terms that should be explained clearly in the summary.',
          },
        },
        required: ['soapNote'],
      },
    },
    async (input) => {
      const { soapNote, clinicalTerms } = input
      if (!soapNote) throw new Error('Missing required argument: soapNote')
      const summary = await generatePatientSummary(soapNote, clinicalTerms)
      return { summary }
    }
  )

  // 4. generate_triage_priority
  registry.registerTool(
    {
      name: 'generate_triage_priority',
      description:
        'Evaluates chief complaint, symptoms, and vital signs to assign a clinical triage acuity priority (emergent, urgent, routine) with clinical rationale.',
      inputSchema: {
        type: 'object',
        properties: {
          chiefComplaint: {
            type: 'string',
            description: 'The primary reason for visit or patient complaint.',
          },
          symptoms: {
            type: 'string',
            description: 'Detailed description of symptoms, duration, and severity.',
          },
          vitalSigns: {
            type: 'string',
            description: 'Optional vital signs (BP, HR, RR, SpO2, Temperature).',
          },
        },
        required: ['chiefComplaint', 'symptoms'],
      },
    },
    async (input) => {
      const { chiefComplaint, symptoms, vitalSigns } = input
      if (!chiefComplaint) throw new Error('Missing required argument: chiefComplaint')
      if (!symptoms) throw new Error('Missing required argument: symptoms')
      return await generateTriagePriority(chiefComplaint, symptoms, vitalSigns)
    }
  )

  // 5. generate_follow_up_plan
  registry.registerTool(
    {
      name: 'generate_follow_up_plan',
      description:
        'Generates an actionable post-consultation follow-up care plan including timing, monitoring parameters, medication management, and warning signs.',
      inputSchema: {
        type: 'object',
        properties: {
          assessment: {
            type: 'string',
            description: 'The clinical assessment and diagnostic impression.',
          },
          medications: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of prescribed or continuing medications.',
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
    async (input) => {
      const { assessment, medications, procedures } = input
      if (!assessment) throw new Error('Missing required argument: assessment')
      if (!Array.isArray(medications)) throw new Error('Missing required argument: medications array')
      const plan = await generateFollowUpPlan(assessment, medications, procedures)
      return { plan }
    }
  )

  // 6. get_clinical_suggestions
  registry.registerTool(
    {
      name: 'get_clinical_suggestions',
      description:
        'Generates real-time contextual clinical suggestions and differential considerations for a clinician during an active consultation.',
      inputSchema: {
        type: 'object',
        properties: {
          transcript: {
            type: 'string',
            description: 'Recent transcript of the active consultation conversation.',
          },
          patientHistory: {
            type: 'string',
            description: 'Patient background history or active conditions.',
          },
          currentSymptoms: {
            type: 'string',
            description: 'Reported symptoms in the current session.',
          },
        },
        required: ['transcript', 'patientHistory', 'currentSymptoms'],
      },
    },
    async (input) => {
      const { transcript, patientHistory, currentSymptoms } = input
      const suggestions = await getClinicaSuggestions(transcript, patientHistory, currentSymptoms)
      return { suggestions }
    }
  )

  // 7. analyze_session_sentiment
  registry.registerTool(
    {
      name: 'analyze_session_sentiment',
      description:
        'Analyzes consultation conversation for patient emotional sentiment, clinical urgency, and red flags.',
      inputSchema: {
        type: 'object',
        properties: {
          transcript: {
            type: 'string',
            description: 'Transcript text to evaluate for clinical urgency and sentiment.',
          },
        },
        required: ['transcript'],
      },
    },
    async (input) => {
      const { transcript } = input
      if (!transcript) throw new Error('Missing required argument: transcript')
      return await analyzeSessionSentiment(transcript)
    }
  )
}
