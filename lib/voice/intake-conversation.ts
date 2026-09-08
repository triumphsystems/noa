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
- Core Missing Details to Collect: ${missing.length > 0 ? missing.join(', ') : 'All standard intake categories addressed'}

CONVERSATIONAL WORKFLOW & DIRECTIVES:
1. ADMINISTRATIVE IDENTITY IS PERMANENT:
   - Full name, date of birth, gender, email, phone number, and emergency contact are administrative details.
   - Once recorded above, NEVER ask the patient for their name, date of birth, email, or phone again, unless the patient specifically asks to correct or update them.
   - Address the patient warmly by their first name (${draft?.firstName || 'the patient'}) if known.

2. CLINICAL HEALTH IS DYNAMIC AND EVOLVES:
   - Reason for visit & symptoms: Listen carefully to what brings them in today (onset, severity, location, duration).
   - Conditions, medications, and allergies: Actively listen for new diagnoses, current medications, or allergies.
   - If the patient says they have no allergies, no medications, or no prior medical conditions, acknowledge and record that clearly.

3. INTAKE COMPLETION & FINALIZATION (CRITICAL):
   - You MUST ensure all missing details listed above are collected before attempting to finalize. Ask for missing details one at a time.
   - When ALL required fields have been collected:
     * Ask ONCE: "We have captured all your key information. Is there anything else you would like your doctor to know before we finalize?"
   - When the patient indicates they have NOTHING else to add (e.g., "no", "that's all", "nothing else", "I'm good", "nope", "that is everything", "no more"):
     * DO NOT ask if they have anything else again! DO NOT repeat the question.
     * Conclude warmly: "Thank you, ${draft?.firstName || 'there'}! Your intake is complete. I have recorded all your information and shared it with your doctor. Have a wonderful day!"
   - If the patient DOES want to share additional symptoms or health details:
     * Listen attentively, acknowledge warmly, and incorporate the details.
     * Then ask if they are ready to finalize.

4. COMMUNICATION STYLE:
   - Ask one concise, supportive question at a time.
   - Speak in a calm, compassionate, professional clinical tone.
   - Understand any language spoken, but respond in ${language}.
   - Do not provide medical diagnoses or prescribe treatments.`;
}

/**
 * Detects if the patient's statement indicates they have nothing further to add
 * or confirms completion.
 */
export function isNegativeConfirmation(text: string): boolean {
  if (!text) return false;
  const clean = text.trim().toLowerCase().replace(/[.!?,]/g, '');
  const exactNegatives = new Set([
    'no',
    'nope',
    'nah',
    'no thanks',
    'no thank you',
    'nothing',
    'nothing else',
    'no nothing else',
    'no that is all',
    'no that is everything',
    'no thats all',
    'no thats everything',
    'thats all',
    'thats everything',
    'that is all',
    'that is everything',
    'im good',
    'i am good',
    'all good',
    'all set',
    'no im good',
    'no i am good',
    'no all good',
    'no all set',
    'i do not have anything else',
    'i dont have anything else',
    'no i do not have anything else',
    'no i dont have anything else',
    'nothing more',
    'no nothing more',
    'none',
    'no more',
    'we are good',
    'thats it',
    'that is it',
    'no thats it',
    'no that is it',
    'ready',
    'ready to finalize',
  ]);
  if (exactNegatives.has(clean)) return true;

  const negativePattern =
    /^(no|nope|nah)\b.*(nothing|that'?s (all|it|everything)|(i'?m|we'?re) (good|all set)|don'?t have anything|ready)/i;
  const nothingPattern =
    /^(nothing else|that'?s (all|it|everything)|(i'?m|we'?re) (good|all set)|i don'?t have anything else)/i;
  return negativePattern.test(clean) || nothingPattern.test(clean);
}

/**
 * Checks if the assistant message asked the patient whether they have anything else to add
 * before finalizing.
 */
export function isFinalizationQuestion(text: string): boolean {
  if (!text) return false;
  return /anything else.*(doctor|know|finalize|add)|ready to finalize|before we finalize/i.test(
    text
  );
}

/**
 * Generates an empathetic prompt targeting the next missing required clinical field.
 */
export function generateMissingFieldPrompt(
  missingField: string,
  firstName?: string,
  _language: string = 'English'
): string {
  const name = firstName ? `${firstName}, ` : '';
  switch (missingField) {
    case 'full name':
      return `What is your full name?`;
    case 'date of birth':
      return `${name}could you please provide your date of birth?`;
    case 'contact phone or email':
      return `${name}what is the best phone number or email address to reach you?`;
    case 'symptoms or reason for visit':
      return `${name}what symptoms or medical concerns bring you in to see the doctor today?`;
    case 'medical conditions':
      return `${name}do you have any ongoing medical conditions or chronic illnesses, or are you generally healthy?`;
    case 'current medications':
      return `${name}are you currently taking any prescription or over-the-counter medications?`;
    case 'known allergies':
      return `${name}do you have any known allergies to medications, foods, or environmental triggers?`;
    case 'emergency contact':
      return `${name}could you please provide the name and phone number of an emergency contact?`;
    case 'consent to submit':
      return `${name}do you give consent to submit your intake information to your doctor?`;
    default:
      return `${name}could you please provide your ${missingField}?`;
  }
}

/**
 * Ensures negative or 'none' verbal responses are properly structured into the draft.
 */
export function normalizeClinicalDraft(
  draft: IntakeConversationDraft,
  transcript: string
): void {
  const t = transcript.toLowerCase();
  // Allergies
  if (!draft.allergies || draft.allergies.length === 0) {
    if (
      /(no|none|never had|don'?t have|not aware of).*(allerg|reaction)/i.test(t) ||
      /^(no|none|no allergies|nope)[.!]?$/i.test(t.trim())
    ) {
      draft.allergies = ['No known allergies'];
    }
  }
  // Current medications
  if (!draft.currentMedications || draft.currentMedications.length === 0) {
    if (
      /(no|none|not taking|don'?t take).*(med|prescription|pill|drug)/i.test(t) ||
      /^(no|none|no medications|no meds|nope)[.!]?$/i.test(t.trim())
    ) {
      draft.currentMedications = ['None'];
    }
  }
  // Medical conditions
  if (!draft.medicalConditions || draft.medicalConditions.length === 0) {
    if (
      /(no|none|don'?t have|healthy).*(condition|illness|disease|problem)/i.test(t) ||
      /^(no|none|no conditions|healthy|nope)[.!]?$/i.test(t.trim())
    ) {
      draft.medicalConditions = ['None reported'];
    }
  }
  // Emergency contact
  if (!draft.emergencyContactName?.trim()) {
    if (/(no|don'?t have|none|skip).*(emergency contact|contact)/i.test(t)) {
      draft.emergencyContactName = 'None provided';
    }
  }
  // Email if phone is provided
  if (!draft.email?.trim() && draft.phone?.trim()) {
    if (/(no|don'?t have|none).*(email)/i.test(t)) {
      draft.email = 'N/A';
    }
  }
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
  * If the patient states they have no allergies, record ["No known allergies"].
  * If the patient takes no medications, record ["None"].
  * If the patient has no medical conditions or chronic illnesses, record ["None reported"].
  * If the patient has no emergency contact, record "None provided".

Information Already Recorded on Draft:
${populated.length > 0 ? populated.map((p) => `- ${p}`).join('\n') : 'None recorded yet.'}

Remaining Fields Still Missing (MUST BE COLLECTED BEFORE COMPLETION):
${missing.length > 0 ? missing.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'All required fields captured.'}

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

Completion & Finalization Protocol (CRITICAL):
1. IF ANY REQUIRED FIELDS ARE STILL MISSING:
   - Your assistantMessage MUST ask for the next missing field in order (${missing[0] || 'next missing item'}).
   - DO NOT skip missing fields.
   - You MUST set isComplete to false.
   - DO NOT ask if they have anything else to add while fields are still missing.
2. WHEN ALL REQUIRED FIELDS ARE CAPTURED:
   - If the patient has NOT yet been asked if they have anything else to add:
     * assistantMessage: "We have captured all your intake details. Is there anything else you would like your doctor to know before we finalize?"
     * isComplete: false
   - When the patient responds that they have NOTHING else to add (e.g. "no", "that's all", "nothing else", "I'm good", "nope", "that is everything", "all set"):
     * DO NOT ask if they have anything else again!
     * isComplete: true
     * draft.consentRead: true
     * assistantMessage: Provide a warm, reassuring closing message in ${language} (e.g. "Thank you, ${draft.firstName || 'patient'}! Your intake is complete. I've recorded all your details and shared them with your doctor. You're all set!")
   - If the patient DOES add more symptoms or clinical information:
     * Incorporate the notes into the draft and summary.
     * Acknowledge warmly and ask: "I've noted that down. Is there anything else, or are you ready to finalize?"
     * isComplete: false`;

  try {
    const { text } = await invokeClinicalAI({
      prompt: `${prompt}\n\nIntake assistant response:`,
      maxTokens: 900,
      temperature: 0.2,
      modelTier: 'fast',
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    const updatedDraft: IntakeConversationDraft = parsed.draft
      ? { ...draft, ...parsed.draft }
      : draft;

    // Normalize verbal negatives for clinical fields (e.g. "no allergies")
    normalizeClinicalDraft(updatedDraft, transcript);

    const actualMissing = getMissingFields(updatedDraft);

    // Context analysis for finalization
    const lastAssistantMsg =
      history.filter((m) => m.role === 'assistant').pop()?.content || '';
    const wasAskedFinalize = isFinalizationQuestion(lastAssistantMsg);
    const userSaidNoMore = isNegativeConfirmation(transcript);

    let isComplete = false;
    let assistantMessage =
      parsed.assistantMessage || 'Please tell me the next detail.';

    if (actualMissing.length === 0) {
      if (wasAskedFinalize && userSaidNoMore) {
        isComplete = true;
        updatedDraft.consentRead = true;
        if (isFinalizationQuestion(assistantMessage)) {
          const patientName = updatedDraft.firstName || 'there';
          assistantMessage = `Thank you, ${patientName}! Your intake is complete. I have recorded all your information and shared it with your doctor.`;
        }
      } else if (parsed.isComplete && !userSaidNoMore && wasAskedFinalize) {
        isComplete = true;
        updatedDraft.consentRead = true;
      } else if (parsed.isComplete && updatedDraft.consentRead) {
        isComplete = true;
      } else {
        isComplete = false;
      }
    } else {
      // Required fields are still missing -> CANNOT complete!
      isComplete = false;
      updatedDraft.consentRead = false;
      // If assistant was asking to finalize or saying complete while fields are missing, redirect to missing field
      if (
        isFinalizationQuestion(assistantMessage) ||
        /intake.*(complete|finished|done|finalized)/i.test(assistantMessage)
      ) {
        assistantMessage = generateMissingFieldPrompt(
          actualMissing[0],
          updatedDraft.firstName,
          language
        );
      }
    }

    return {
      assistantMessage,
      detectedLanguage: parsed.detectedLanguage || language,
      normalizedTranscript: parsed.normalizedTranscript || transcript,
      draft: updatedDraft,
      missingFields: actualMissing,
      isComplete,
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
