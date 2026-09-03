export interface PromptPreset {
  label: string
  description: string
  defaultArgs: Record<string, string>
}

export const PROMPT_PRESETS: Record<string, PromptPreset> = {
  'soap-note-generation': {
    label: 'SOAP Note Generation',
    description: 'Generates structured clinical SOAP documentation from consultation transcript',
    defaultArgs: {
      transcript:
        'Doctor: Good morning John, what brings you in today?\nPatient: I have had persistent dry cough and slight fever for 3 days.\nDoctor: Any shortness of breath or chest pain?\nPatient: Mild chest tightness when coughing, but no acute pain.',
      patientContext: 'John Doe, 48yo male, non-smoker, history of mild seasonal allergies.',
    },
  },
  'clinical-insights': {
    label: 'Clinical Insights & Differential',
    description: 'Deep clinical reasoning, differential diagnosis, and diagnostic workup recommendations',
    defaultArgs: {
      patientHistory: '48yo male, hypertension treated with Lisinopril 10mg.',
      currentPresentation:
        'Persistent dry cough x 3 days, low grade fever (38.1C), mild wheeze on expiration.',
      previousFindings: 'Chest X-ray 6 months ago was clear. Normal baseline renal panel.',
    },
  },
  'patient-summary': {
    label: 'Patient-Friendly Summary',
    description: 'Translates complex medical SOAP notes into plain, reassuring patient instructions',
    defaultArgs: {
      soapNote:
        'ASSESSMENT: Acute viral bronchitis. Prescribed albuterol MDI 2 puffs q4h prn. PLAN: Hydration, rest, return if dyspnea worsens.',
    },
  },
  'triage-assessment': {
    label: 'Triage Urgency Assessment',
    description: 'Evaluates chief complaint and symptoms to assign clinical triage priority',
    defaultArgs: {
      chiefComplaint: 'Shortness of breath and wheezing',
      symptoms:
        'Patient reports progressive dyspnea since yesterday evening, audible expiratory wheeze, spoke in short sentences.',
    },
  },
  'intake-conversation-turn': {
    label: 'Intake Assistant Turn',
    description: 'Conversational intake AI generating empathetic questions based on patient responses',
    defaultArgs: {
      conversationHistory:
        'AI: Welcome! Could you tell me what symptoms you are experiencing today?\nPatient: My lower back has been aching since I lifted heavy boxes yesterday.',
      currentAnswer: 'The pain is worse when bending forward and radiates slightly to my left hip.',
    },
  },
  'follow-up-care-plan': {
    label: 'Follow-Up Care Plan',
    description: 'Synthesizes discharge instructions, red flags, and follow-up milestones',
    defaultArgs: {
      assessment: 'Acute lumbosacral muscle strain with mild left gluteal radiation.',
      medications: 'Ibuprofen 400mg TID with food, Cyclobenzaprine 5mg QHS prn spasms.',
    },
  },
}

export interface ToolPreset {
  id: string
  name: string
  desc: string
  params: Record<string, { type: string; description: string }>
  code: string
}

export const TOOL_PRESETS: ToolPreset[] = [
  {
    id: 'bmi',
    name: 'calculate_bmi',
    desc: 'Calculate Body Mass Index (BMI) and categorization given weight (kg) and height (cm)',
    params: {
      weightKg: { type: 'number', description: 'Weight in kilograms (e.g. 70)' },
      heightCm: { type: 'number', description: 'Height in centimeters (e.g. 175)' },
    },
    code: `const weight = Number(input.weightKg || 70)
const heightM = Number(input.heightCm || 175) / 100
const bmi = Number((weight / (heightM * heightM)).toFixed(1))
let category = 'Normal weight'
if (bmi < 18.5) category = 'Underweight'
else if (bmi >= 25 && bmi < 30) category = 'Overweight'
else if (bmi >= 30) category = 'Obesity'
return { bmi, category, classification: category, normalRange: '18.5 - 24.9' }`,
  },
  {
    id: 'map',
    name: 'calculate_map',
    desc: 'Calculate Mean Arterial Pressure (MAP) from systolic and diastolic blood pressure',
    params: {
      systolic: { type: 'number', description: 'Systolic blood pressure (mmHg)' },
      diastolic: { type: 'number', description: 'Diastolic blood pressure (mmHg)' },
    },
    code: `const sbp = Number(input.systolic || 120)
const dbp = Number(input.diastolic || 80)
const map = Number(((2 * dbp + sbp) / 3).toFixed(1))
const isPerfusionAdequate = map >= 65
return { map, unit: 'mmHg', adequatePerfusion: isPerfusionAdequate, target: '>= 65 mmHg' }`,
  },
  {
    id: 'egfr',
    name: 'estimate_egfr_ckd_epi',
    desc: 'Estimate glomerular filtration rate (eGFR) using CKD-EPI equation',
    params: {
      creatinine: { type: 'number', description: 'Serum creatinine (mg/dL)' },
      age: { type: 'number', description: 'Patient age in years' },
      isFemale: { type: 'boolean', description: 'True if female, false if male' },
    },
    code: `const cr = Number(input.creatinine || 1.0)
const age = Number(input.age || 50)
const isFemale = Boolean(input.isFemale)
const k = isFemale ? 0.7 : 0.9
const a = isFemale ? -0.241 : -0.302
const min = Math.min(cr / k, 1)
const max = Math.max(cr / k, 1)
const egfr = Math.round(142 * Math.pow(min, a) * Math.pow(max, -1.200) * Math.pow(0.9938, age) * (isFemale ? 1.012 : 1.0))
let stage = 'G1 (Normal or high)'
if (egfr < 15) stage = 'G5 (Kidney failure)'
else if (egfr < 30) stage = 'G4 (Severely decreased)'
else if (egfr < 60) stage = 'G3 (Moderately decreased)'
else if (egfr < 90) stage = 'G2 (Mildly decreased)'
return { egfr, stage, unit: 'mL/min/1.73m²' }`,
  },
]

export const RESOURCE_TEMPLATES = [
  { uri: 'patient://patient-1', label: 'Patient Record', desc: 'Demographics, medical conditions, allergies' },
  { uri: 'patient://patient-1/history', label: 'Medical History', desc: 'Prior surgeries, medications, clinical notes' },
  { uri: 'doctor://doctor-1', label: 'Doctor Profile', desc: 'Credentials, specialty, clinic affiliation' },
  { uri: 'doctor://doctor-1/dashboard', label: 'Doctor Dashboard', desc: 'Recent patient queue & active consultations' },
  { uri: 'session://session-1', label: 'Consultation Session', desc: 'Status, startedAt, duration, metadata' },
  { uri: 'session://session-1/transcript', label: 'Live Transcript', desc: 'Voice transcription dialogue turns' },
  { uri: 'soap://session-1', label: 'SOAP Note Document', desc: 'Subjective, Objective, Assessment, Plan' },
  { uri: 'intake://patient-1', label: 'Patient Intake Form', desc: 'Pre-visit questionnaire answers' },
]
