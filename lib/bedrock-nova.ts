/**
 * Clinical Intelligence Engine (AWS Nova & Local LLM Provider)
 * Powers SOAP notes, clinical decision support, triage, and care plans.
 * Backed by the unified invokeClinicalAI provider engine.
 */

import { invokeClinicalAI } from '@/lib/ai/provider';

/**
 * Generate SOAP notes from clinical transcript using Nova Lite (or Local LLM)
 */
export async function generateSOAPWithNova(
  transcript: string,
  patientContext?: string
): Promise<{
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}> {
  const systemPrompt = `You are a clinical documentation expert. Convert the following medical consultation transcript into a structured SOAP note.
  
Patient Context: ${patientContext || 'N/A'}

Format your response EXACTLY as follows:
SUBJECTIVE:
[Chief complaint and history of present illness]

OBJECTIVE:
[Vital signs, physical examination, test results]

ASSESSMENT:
[Clinical impressions and diagnoses]

PLAN:
[Treatment plan, medications, follow-up]`;

  const prompt = `Consultation Transcript:\n${transcript}`;

  const { text } = await invokeClinicalAI({
    prompt,
    systemPrompt,
    maxTokens: 2000,
    temperature: 0.3,
    modelTier: 'fast',
  });

  // Parse the response into SOAP sections
  return {
    subjective: extractSection(text, 'SUBJECTIVE'),
    objective: extractSection(text, 'OBJECTIVE'),
    assessment: extractSection(text, 'ASSESSMENT'),
    plan: extractSection(text, 'PLAN'),
  };
}

/**
 * Generate clinical insights and recommendations from patient data
 */
export async function generateClinicalInsights(
  patientHistory: string,
  currentPresentation: string,
  previousFindings?: string
): Promise<string> {
  const prompt = `As a clinical AI assistant, analyze the following patient information and provide clinical insights and recommendations.

Patient Medical History:
${patientHistory}

Current Presentation:
${currentPresentation}

${previousFindings ? `Previous Clinical Findings:\n${previousFindings}` : ''}

Provide:
1. Key clinical considerations
2. Recommended investigations or assessments
3. Differential diagnosis considerations
4. Clinical decision support recommendations
5. Patient education points

Format the response in clear, actionable clinical language.`;

  const { text } = await invokeClinicalAI({
    prompt,
    maxTokens: 1500,
    temperature: 0.5,
    modelTier: 'reasoning',
  });

  return text;
}

/**
 * Generate patient-friendly summary from clinical notes
 */
export async function generatePatientSummary(
  soapNote: string,
  clinicalTerms?: string[]
): Promise<string> {
  const prompt = `Convert the following clinical SOAP note into a patient-friendly summary. 
  
Use simple, clear language. Avoid medical jargon or explain it in parentheses.
Focus on: what was found, what it means for the patient, and what they need to do next.

SOAP Note:
${soapNote}

${clinicalTerms ? `Important terms to explain: ${clinicalTerms.join(', ')}` : ''}

Write a warm, reassuring summary that a patient can easily understand.`;

  const { text } = await invokeClinicalAI({
    prompt,
    maxTokens: 1000,
    temperature: 0.7,
    modelTier: 'fast',
  });

  return text;
}

/**
 * Extract specific section from SOAP text
 */
function extractSection(text: string, section: string): string {
  const regex = new RegExp(
    `${section}:\\s*(.+?)(?=(?:SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN):|$)`,
    'is'
  );
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Generate triage priority from chief complaint and symptoms
 */
export async function generateTriagePriority(
  chiefComplaint: string,
  symptoms: string,
  vitalSigns?: string
): Promise<{
  priority: 'emergent' | 'urgent' | 'routine';
  reason: string;
  recommendations: string[];
}> {
  const prompt = `As a clinical triage nurse, evaluate this patient presentation and assign a triage priority.

Chief Complaint: ${chiefComplaint}
Symptoms: ${symptoms}
${vitalSigns ? `Vital Signs: ${vitalSigns}` : ''}

Respond in JSON format:
{
  "priority": "emergent" | "urgent" | "routine",
  "reason": "Brief reason for priority assignment",
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}

Base priority on:
- EMERGENT: Life-threatening, immediate risk, severe symptoms
- URGENT: Significant symptoms, needs prompt evaluation, risk of deterioration
- ROUTINE: Stable, mild-moderate symptoms, can wait for scheduled appointment`;

  const { text } = await invokeClinicalAI({
    prompt,
    maxTokens: 500,
    temperature: 0.2,
    modelTier: 'fast',
  });

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Fall through to default structure
    }
  }

  return {
    priority: 'routine',
    reason: 'Clinical priority evaluated',
    recommendations: [],
  };
}

/**
 * Generate follow-up care plan
 */
export async function generateFollowUpPlan(
  assessment: string,
  medications: string[],
  procedures?: string[]
): Promise<string> {
  const prompt = `Based on the clinical assessment, generate a structured follow-up care plan.

Clinical Assessment: ${assessment}
Current Medications: ${medications.join(', ')}
${procedures ? `Procedures: ${procedures.join(', ')}` : ''}

Create a follow-up plan that includes:
1. Follow-up appointment timing (1-2 weeks, 1 month, 3 months, etc.)
2. Monitoring parameters
3. When to seek immediate care
4. Medication management
5. Lifestyle modifications
6. Patient education topics

Format as a clear, actionable plan.`;

  const { text } = await invokeClinicalAI({
    prompt,
    maxTokens: 1200,
    temperature: 0.5,
    modelTier: 'fast',
  });

  return text;
}
