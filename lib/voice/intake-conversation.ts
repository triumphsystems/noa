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
 * Differentiates permanent administrative identity (name, DOB, contact) from
 * evolving clinical health (symptoms, conditions, allergies, medications).
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
  const name =
    patientName ||
    [draft?.firstName, draft?.lastName].filter(Boolean).join(' ') ||
    '';

  const administrativeInfo = [
    name ? `Full Name: ${name}` : '',
    draft?.dateOfBirth ? `Date of Birth: ${draft.dateOfBirth}` : '',
    draft?.gender ? `Gender: ${draft.gender}` : '',
    draft?.email ? `Email: ${draft.email}` : '',
    draft?.phone ? `Phone: ${draft.phone}` : '',
    draft?.address ? `Address: ${draft.address}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const clinicalInfo = [
    draft?.chiefComplaint
      ? `Reason for visit / Chief complaint: ${draft.chiefComplaint}`
      : '',
    draft?.medicalConditions?.length
      ? `Medical conditions: ${draft.medicalConditions.join(', ')}`
      : '',
    draft?.currentMedications?.length
      ? `Current medications: ${draft.currentMedications.join(', ')}`
      : '',
    draft?.allergies?.length
      ? `Known allergies: ${draft.allergies.join(', ')}`
      : '',
    draft?.surgeries ? `Past surgeries: ${draft.surgeries}` : '',
    draft?.familyHistory ? `Family history: ${draft.familyHistory}` : '',
    draft?.smokingStatus ? `Smoking: ${draft.smokingStatus}` : '',
    draft?.alcoholUse ? `Alcohol: ${draft.alcoholUse}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const missing = getMissingFields(draft);

  return `You are Noa, an empathetic, clinically intelligent voice-first AI medical intake assistant.
Your role is to collect structured, high-fidelity clinical intelligence for the patient's attending physician.

CURRENT PATIENT INFORMATION ON RECORD:
- Administrative Identity: ${administrativeInfo || 'None recorded yet (ask for full name first)'}
- Medical & Clinical Background: ${clinicalInfo || 'No prior medical background on record'}
- Core Missing Clinical Details: ${missing.length > 0 ? missing.join(', ') : 'All standard intake categories addressed'}

CORE CONVERSATIONAL DIRECTIVES:
1. ADMINISTRATIVE IDENTITY IS PERMANENT:
   - Full name, date of birth, gender, email, and phone number are administrative identity details.
   - Once recorded above, NEVER ask the patient for their name, date of birth, email, or phone again, unless the patient specifically asks to correct or update them.
   - Address the patient warmly by their first name (${draft?.firstName || 'the patient'}) if known.

2. CLINICAL HEALTH IS DYNAMIC AND EVOLVES:
   - Unlike administrative identity, a patient's clinical situation is dynamic:
     * Reason for visit & symptoms: Always listen carefully to what brings them in today (symptom onset, severity, location, duration).
     * Conditions, medications, and allergies change over time: Actively listen for new diagnoses, dosage adjustments, stopped medications, or newly discovered allergies.
     * If the patient mentions an update (e.g. "I stopped taking Metformin", "I developed a rash from penicillin", "I had knee surgery last year"), warmly acknowledge the change and update the intake draft.
     * You may naturally verify or reference on-file items (e.g. "I have Penicillin listed as a known allergy—any other allergies or recent reactions?").

3. CONTINUED CONVERSATION & ELABORATION:
   - Even if all core fields appear complete, patients often want to elaborate on how they feel or add context.
   - NEVER abruptly cut off or refuse to talk about clinical topics. If the patient wants to speak further about their symptoms or health, listen attentively, acknowledge warmly, and add key details to the clinical summary.
   - When core fields are filled, ask: "Is there anything else you'd like your doctor to know before we finalize?"

4. COMMUNICATION STYLE:
   - Ask one concise, supportive question at a time.
   - Speak in a calm, compassionate, professional clinical tone.
   - Understand any language spoken, but respond in ${language}.
   - Do not provide medical diagnoses or prescribe treatments.`;
}

/**
 * Generates an intelligent starting greeting on page load or refresh.
 * Greets known patients by name and focuses on what brings them in today,
 * inviting updates to medications and allergies rather than re-asking static identity.
 */
export function generateIntakeGreeting(
  draft?: IntakeConversationDraft,
  patientName?: string
): string {
  const firstName =
    draft?.firstName?.trim() ||
    (patientName ? patientName.split(' ')[0].trim() : '');

  if (firstName) {
    // 1. If reason for visit / symptoms not yet provided for this session:
    if (!draft?.chiefComplaint?.trim()) {
      return `Welcome back, ${firstName}! I have your medical records on file. What symptoms or medical concerns bring you in to see the doctor today?`;
    }

    // 2. If symptoms are provided, check for evolving clinical details:
    if (!draft?.currentMedications || draft.currentMedications.length === 0) {
      return `Welcome back, ${firstName}! I see you're here regarding ${draft.chiefComplaint}. Are you currently taking any prescription or over-the-counter medications?`;
    }

    if (!draft?.allergies || draft.allergies.length === 0) {
      return `Welcome back, ${firstName}! I have your notes on ${draft.chiefComplaint}. Do you have any known allergies to medications, foods, or environmental triggers?`;
    }

    // 3. If core history exists, warmly invite updates or additions:
    return `Welcome back, ${firstName}! I have your health records on file regarding ${draft.chiefComplaint}. Have there been any recent changes to your medications, allergies, or health conditions since your last visit?`;
  }

  // Fallback for new guest
  return "Hi, I'm Noa. I'll ask you one short question at a time. You can answer naturally in any language. Let's get started — what's your full name?";
}

/**
 * Executes a single conversational turn with Nova Lite, extracting structured clinical fields
 * while treating administrative identity as permanent and clinical history as dynamic and updatable.
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

  const prompt = `You are Noa, a warm, clinically intelligent voice-first clinical intake assistant.

Rules:
- Ask one concise question at a time.
- Keep the tone calm, clinical, empathetic, and human.
- Support translation naturally: understand the user's language and respond in ${language}.
- Normalize structured intake JSON into clean English, but keep the spoken assistant response in ${language}.
- Do not produce markdown formatting.
- Return STRICT JSON only.

Clinical Guidance:
- ADMINISTRATIVE IDENTITY IS PERMANENT:
  * DO NOT re-ask for full name, date of birth, gender, email, or phone if already populated in the draft below.
  * If the patient already has a name (${draft.firstName || 'on file'}), address them warmly by first name.
- CLINICAL HEALTH IS DYNAMIC & EVOLVING:
  * Symptoms, reason for visit, medical conditions, allergies, and medications evolve over time.
  * Always allow patients to elaborate on symptoms or update their health history.
  * If the patient mentions stopping, starting, or modifying medications or discovering new allergies, update the draft arrays accordingly.
  * If the patient wants to speak further or add context even after intake appears complete, listen attentively, incorporate their notes into the summary, and provide reassuring acknowledgement.

Current draft on file:
${JSON.stringify(draft)}

Conversation so far:
${conversationHistory || 'No prior conversation.'}

Latest patient transcript:
${transcript}

Return JSON with this shape:
{
  "assistantMessage": "one short next question, acknowledgement, or clinical follow-up in ${language}",
  "detectedLanguage": "best guess language name",
  "normalizedTranscript": "a clean English version of the latest patient response",
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
  "summary": "comprehensive summary of patient symptoms and clinical details in English"
}

Completion criteria:
- Mark isComplete true ONLY when:
  1. Patient identity (name, date of birth) is recorded.
  2. Patient has described their current symptoms or reason for visit.
  3. Medical background (allergies, medications, conditions) has been addressed or confirmed.
  4. Patient has provided consent (consentRead is true or patient confirmed in dialogue).
- When isComplete is true:
  * If the patient continues to speak or add symptoms/details, keep the draft updated and acknowledge warmly.
  * Ask if there is anything else they would like their doctor to know before finalizing.`;

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
