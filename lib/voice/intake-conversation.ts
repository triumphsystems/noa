import { invokeClinicalAI } from '@/lib/ai/provider';
import {
  type IntakeConversationDraft,
  type IntakeConversationMessage,
  type IntakeConversationResult,
  getPopulatedFields,
  getMissingFields,
} from './types';

/**
 * Builds a dynamic clinical system prompt for the voice intake agent (Nova Sonic & Nova Lite).
 * Explicitly provides already-captured fields and lists only missing fields,
 * guaranteeing the AI will never re-ask for details already on record.
 */
export function buildIntakeSystemPrompt({
  draft,
  patientName,
  language = 'English',
}: {
  draft?: IntakeConversationDraft;
  patientName?: string;
  language?: string;
}): string {
  const populated = getPopulatedFields(draft);
  const missing = getMissingFields(draft);

  const name =
    patientName ||
    [draft?.firstName, draft?.lastName].filter(Boolean).join(' ') ||
    '';

  let contextSnippet = '';
  if (populated.length > 0) {
    contextSnippet = `
KNOWN PATIENT RECORD & DETAILS ALREADY ON FILE:
${populated.map((p) => `- ${p}`).join('\n')}

REMAINING MISSING CLINICAL DETAILS NEEDED:
${missing.map((m) => `- ${m}`).join('\n')}

CRITICAL DIRECTIVES:
1. DO NOT ask the patient for any detail that is already on file above (such as full name, date of birth, known conditions, allergies, or contact details).
2. If the patient's name is known (${name || 'known'}), address them naturally by name and do NOT ask for their name or identity again.
3. Focus ONLY on asking for the remaining missing clinical details and what brings them in today.
4. Ask one concise, clear question at a time.`;
  } else {
    contextSnippet = `
NEW / GUEST PATIENT:
No prior record exists. Start by welcoming the patient and asking for their full name.`;
  }

  return `You are Noa, a warm, professional voice-first AI clinical intake assistant.
Your role is to collect medical intake information for the patient's physician through calm, human conversation.

Rules:
- Ask one concise question at a time.
- Keep the tone calm, clinical, empathetic, and clear.
- Support translation naturally: understand the user's language and respond in ${language}.
- If the user gives information in another language, normalize it into the intake JSON in English, but keep spoken responses in ${language}.
- Do not produce markdown formatting.
- Do not diagnose or give medical advice.
${contextSnippet}`;
}

/**
 * Generates an intelligent starting greeting on page load or refresh.
 * If data is already on record, it greets the patient by name and asks for the next missing piece.
 * Only asks for full name if no record or identity exists.
 */
export function generateIntakeGreeting(
  draft?: IntakeConversationDraft,
  patientName?: string
): string {
  const firstName =
    draft?.firstName?.trim() ||
    (patientName ? patientName.split(' ')[0].trim() : '');

  const missing = getMissingFields(draft);

  if (firstName) {
    // Patient has identity on file
    if (missing.length === 0 || (missing.length === 1 && missing[0] === 'consent to submit')) {
      return `Welcome back, ${firstName}! I have all your core intake information on record. Please review your details on the right and confirm when you're ready to submit.`;
    }

    // Pick the most clinically urgent missing field
    let nextMissingPrompt = 'what symptoms or health concerns bring you in today?';
    if (!draft?.chiefComplaint?.trim() && (!draft?.medicalConditions || draft.medicalConditions.length === 0)) {
      nextMissingPrompt = 'what symptoms or health concerns bring you in to see the doctor today?';
    } else if (!draft?.allergies || draft.allergies.length === 0) {
      nextMissingPrompt = 'do you have any known allergies to medications, food, or latex?';
    } else if (!draft?.currentMedications || draft.currentMedications.length === 0) {
      nextMissingPrompt = 'are you currently taking any prescription or over-the-counter medications?';
    } else if (!draft?.emergencyContactName?.trim()) {
      nextMissingPrompt = 'who is your primary emergency contact, and what is their phone number?';
    }

    return `Welcome back, ${firstName}! I have your profile and records on file. To continue your intake, ${nextMissingPrompt}`;
  }

  // Fallback for new guest
  return "Hi, I'm Noa. I'll ask you one short question at a time. You can answer naturally in any language. Let's get started — what's your full name?";
}

/**
 * Executes a single conversational turn with Nova Lite, extracting structured clinical fields
 * while strictly adhering to what is already on record in DynamoDB.
 */
export async function generateIntakeConversationTurn({
  transcript,
  language,
  history,
  draft,
}: {
  transcript: string;
  language: string;
  history: IntakeConversationMessage[];
  draft: IntakeConversationDraft;
}): Promise<IntakeConversationResult> {
  const conversationHistory = history
    .slice(-12)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');

  const populated = getPopulatedFields(draft);
  const missing = getMissingFields(draft);

  const prompt = `You are Noa, a warm voice-first clinical intake assistant.

Rules:
- Ask one concise question at a time.
- Keep the tone calm, clinical, and human.
- Support translation naturally: understand the user's language and respond in ${language}.
- If the user gives information in another language, normalize it into the intake JSON in English when useful, but keep the spoken assistant response in ${language}.
- Do not produce markdown.
- Return STRICT JSON only.
- CRITICAL: DO NOT ask questions for fields that are ALREADY populated in the current draft below.
  Already populated fields: ${populated.length > 0 ? populated.join('; ') : 'None yet'}.
  Remaining missing fields: ${missing.join(', ')}.
- Focus strictly on missing fields or acknowledging the latest patient statement.

Current draft on file:
${JSON.stringify(draft)}

Conversation so far:
${conversationHistory || 'No prior conversation.'}

Latest user transcript:
${transcript}

Return JSON with this shape:
{
  "assistantMessage": "one short next question, acknowledgement, or closing statement in ${language}",
  "detectedLanguage": "best guess language name",
  "normalizedTranscript": "a clean English version of the latest user response",
  "draft": {
    "firstName": "...",
    "lastName": "...",
    "dateOfBirth": "...",
    "gender": "...",
    "email": "...",
    "phone": "...",
    "address": "...",
    "chiefComplaint": "...",
    "medicalConditions": ["..."],
    "surgeries": "...",
    "allergies": ["..."],
    "currentMedications": ["..."],
    "familyHistory": "...",
    "smokingStatus": "...",
    "alcoholUse": "...",
    "exerciseFrequency": "...",
    "emergencyContactName": "...",
    "emergencyContactPhone": "...",
    "emergencyContactRelation": "...",
    "consentRead": true
  },
  "missingFields": ["fieldName1", "fieldName2"],
  "isComplete": false,
  "summary": "short summary of what has been captured so far in English"
}

Completion criteria:
- Mark isComplete true ONLY when:
  1. The core clinical details are captured (patient identity, reason for visit / symptoms, and medical background).
  2. Patient has provided consent (consentRead is true or patient confirmed consent in dialogue).
- When isComplete is true:
  * DO NOT ask any more questions.
  * Set "missingFields": [].
  * Set "assistantMessage" to a warm closing confirmation in ${language} acknowledging that their intake is complete and securely submitted for their doctor.
- If all clinical details are filled but consent has not been confirmed yet, ask the patient for their consent to submit the intake.
- Prefer asking for the highest priority missing field next.
- The latest user response may contain multiple answers; extract all of them into the draft without erasing existing fields.`;

  try {
    const { text } = await invokeClinicalAI({
      prompt: `${prompt}\n\nIntake assistant response:`,
      maxTokens: 900,
      temperature: 0.2,
      modelTier: 'fast',
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    return {
      assistantMessage:
        parsed.assistantMessage || 'Please tell me the next detail.',
      detectedLanguage: parsed.detectedLanguage || language,
      normalizedTranscript: parsed.normalizedTranscript || transcript,
      draft: parsed.draft ? { ...draft, ...parsed.draft } : draft,
      missingFields: Array.isArray(parsed.missingFields)
        ? parsed.missingFields
        : getMissingFields(parsed.draft || draft),
      isComplete: Boolean(parsed.isComplete),
      summary: parsed.summary || 'Intake captured.',
    };
  } catch (error) {
    console.error(
      '[Voice Service] Error generating intake conversation turn:',
      error
    );
    throw error;
  }
}
