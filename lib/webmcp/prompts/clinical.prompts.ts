/**
 * Clinical Prompts for WebMCP
 * Exposes reusable clinical prompt templates conforming to the MCP Prompts specification.
 */

import { WebMCPRegistry } from '../core/registry';

export function registerClinicalPrompts(registry: WebMCPRegistry): void {
  // 1. soap-note-generation
  registry.registerPrompt(
    {
      name: 'soap-note-generation',
      description:
        'System and user prompt template for synthesizing structured SOAP notes from consultation audio transcripts.',
      arguments: [
        {
          name: 'transcript',
          description: 'Consultation dialogue transcript.',
          required: true,
        },
        {
          name: 'patientContext',
          description: 'Optional past medical history or patient background.',
          required: false,
        },
      ],
    },
    async (args) => {
      const transcript = args.transcript || '';
      const patientContext = args.patientContext || 'N/A';

      return {
        description:
          'Generate structured SOAP note from consultation transcript',
        messages: [
          {
            role: 'system',
            content: {
              type: 'text',
              text: `You are an expert clinical documentation specialist. Convert the consultation transcript into a rigorous SOAP note.
Format strictly with headers:
SUBJECTIVE:
[Chief complaint, HPI, review of systems]

OBJECTIVE:
[Vitals, physical examination, observations]

ASSESSMENT:
[Differential diagnosis, clinical impression]

PLAN:
[Diagnostic testing, treatments, medications, follow-up]`,
            },
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Patient Context: ${patientContext}\n\nConsultation Transcript:\n${transcript}`,
            },
          },
        ],
      };
    }
  );

  // 2. clinical-insights
  registry.registerPrompt(
    {
      name: 'clinical-insights',
      description:
        'Prompt template for generating clinical decision support considerations and differential diagnoses.',
      arguments: [
        {
          name: 'patientHistory',
          description: 'Patient past medical history',
          required: true,
        },
        {
          name: 'currentPresentation',
          description: 'Current signs and symptoms',
          required: true,
        },
        {
          name: 'previousFindings',
          description: 'Prior clinical or lab findings',
          required: false,
        },
      ],
    },
    async (args) => {
      return {
        description: 'Generate clinical considerations and diagnostic support',
        messages: [
          {
            role: 'system',
            content: {
              type: 'text',
              text: 'You are an advanced clinical AI assistant. Analyze the patient presentation against medical literature and guideline-directed medical therapy.',
            },
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Patient Medical History:
${args.patientHistory || 'None provided'}

Current Presentation:
${args.currentPresentation || 'None provided'}

${args.previousFindings ? `Previous Findings:\n${args.previousFindings}` : ''}

Provide:
1. Key clinical considerations
2. Recommended diagnostic evaluations
3. Differential diagnosis considerations
4. Clinical decision support recommendations
5. Red flags requiring immediate intervention`,
            },
          },
        ],
      };
    }
  );

  // 3. patient-summary
  registry.registerPrompt(
    {
      name: 'patient-summary',
      description:
        'Prompt template for translating clinical SOAP notes into patient-accessible health summaries.',
      arguments: [
        {
          name: 'soapNote',
          description: 'The finalized clinical SOAP note',
          required: true,
        },
        {
          name: 'clinicalTerms',
          description: 'Specific medical jargon to clarify',
          required: false,
        },
      ],
    },
    async (args) => {
      return {
        description:
          'Translate clinical SOAP note into patient-friendly language',
        messages: [
          {
            role: 'system',
            content: {
              type: 'text',
              text: 'You are a warm, empathetic medical communicator. Translate the clinical SOAP note into a 6th-grade reading level summary that reassures the patient, explains what was found, and outlines their clear next steps.',
            },
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Clinical SOAP Note:\n${args.soapNote || ''}\n\n${args.clinicalTerms ? `Explain these terms clearly: ${args.clinicalTerms}` : ''}`,
            },
          },
        ],
      };
    }
  );

  // 4. triage-assessment
  registry.registerPrompt(
    {
      name: 'triage-assessment',
      description:
        'Prompt template for evaluating clinical urgency and assigning triage acuity.',
      arguments: [
        {
          name: 'chiefComplaint',
          description: 'Primary symptom or complaint',
          required: true,
        },
        {
          name: 'symptoms',
          description: 'Detailed symptom description',
          required: true,
        },
        {
          name: 'vitalSigns',
          description: 'Patient vital signs',
          required: false,
        },
      ],
    },
    async (args) => {
      return {
        description: 'Evaluate patient triage acuity priority',
        messages: [
          {
            role: 'system',
            content: {
              type: 'text',
              text: 'You are an emergency triage nurse. Evaluate acuity according to standard emergency severity indices (Emergent, Urgent, Routine).',
            },
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Chief Complaint: ${args.chiefComplaint || ''}\nSymptoms: ${args.symptoms || ''}\n${args.vitalSigns ? `Vital Signs: ${args.vitalSigns}` : ''}`,
            },
          },
        ],
      };
    }
  );

  // 5. intake-conversation-turn
  registry.registerPrompt(
    {
      name: 'intake-conversation-turn',
      description:
        'Prompt template for conducting conversational medical intake interview turns.',
      arguments: [
        {
          name: 'transcript',
          description: 'User speech transcript',
          required: true,
        },
        {
          name: 'language',
          description: 'Patient preferred language',
          required: false,
        },
      ],
    },
    async (args) => {
      return {
        description: 'Conduct next conversational intake question turn',
        messages: [
          {
            role: 'system',
            content: {
              type: 'text',
              text: `You are Noa, an empathetic voice-first medical intake assistant. Ask one concise question at a time in ${args.language || 'English'}. Return strict JSON with assistantMessage, draft updates, and isComplete status.`,
            },
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Latest patient response: ${args.transcript || ''}`,
            },
          },
        ],
      };
    }
  );

  // 6. follow-up-care-plan
  registry.registerPrompt(
    {
      name: 'follow-up-care-plan',
      description:
        'Prompt template for synthesizing post-visit care plan recommendations and follow-up milestones.',
      arguments: [
        {
          name: 'assessment',
          description: 'Doctor clinical assessment',
          required: true,
        },
        {
          name: 'medications',
          description: 'Prescribed medications',
          required: true,
        },
      ],
    },
    async (args) => {
      return {
        description: 'Generate follow-up care plan and patient instructions',
        messages: [
          {
            role: 'system',
            content: {
              type: 'text',
              text: 'You are an outpatient care coordinator. Formulate a step-by-step care plan including review appointments, self-monitoring guidelines, and lifestyle recommendations.',
            },
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Assessment: ${args.assessment || ''}\nMedications: ${args.medications || ''}`,
            },
          },
        ],
      };
    }
  );
}
