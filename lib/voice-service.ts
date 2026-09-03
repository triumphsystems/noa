import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getAwsCredentials } from './aws-config'
import { invokeClinicalAI } from '@/lib/ai/provider'

const region = process.env.AWS_REGION || 'us-east-1'
const bedrockCredentials = getAwsCredentials(region)
const s3Credentials = getAwsCredentials(region)

const bedrockClient = new BedrockRuntimeClient({
  region,
  ...(bedrockCredentials ? { credentials: bedrockCredentials } : {}),
})

const s3Client = new S3Client({
  region,
  ...(s3Credentials ? { credentials: s3Credentials } : {}),
})

// Sonic model ID for real-time voice conversations
const SONIC_MODEL = process.env.BEDROCK_SONIC_MODEL || 'anthropic.nova-sonic-v1:0'

interface VoiceMessage {
  role: 'doctor' | 'patient' | 'system'
  content: string
  timestamp: number
}

interface VoiceSessionState {
  messages: VoiceMessage[]
  transcript: string
  recordingActive: boolean
  sessionId: string
}

export interface IntakeConversationMessage {
  role: 'assistant' | 'patient' | 'system'
  content: string
  timestamp: number
}

export interface IntakeConversationDraft {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  gender?: string
  email?: string
  phone?: string
  address?: string
  medicalConditions?: string[]
  surgeries?: string
  allergies?: string[]
  currentMedications?: string[]
  familyHistory?: string
  smokingStatus?: string
  alcoholUse?: string
  exerciseFrequency?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  consentRead?: boolean
}

export interface IntakeConversationResult {
  assistantMessage: string
  detectedLanguage: string
  normalizedTranscript: string
  draft: IntakeConversationDraft
  missingFields: string[]
  isComplete: boolean
  summary: string
}

/**
 * Process voice input and generate AI response for real-time consultation
 */
export async function processVoiceInput(
  userTranscript: string,
  sessionContext: VoiceSessionState,
  patientInfo?: string
): Promise<string> {
  // Build conversation context
  const conversationHistory = sessionContext.messages
    .slice(-10) // Last 10 messages for context
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n')

  const systemPrompt = `You are a supportive clinical AI assistant during a doctor-patient consultation.
Your role is to:
1. Assist the doctor by providing relevant clinical suggestions
2. Help clarify patient symptoms and history
3. Suggest diagnostic considerations
4. Provide evidence-based clinical guidance

Patient Information: ${patientInfo || 'Not provided'}

Conversation Context:
${conversationHistory}

Provide brief, focused responses that support clinical decision-making. Keep responses under 100 words.`

  const prompt = `${systemPrompt}\n\nDoctor/Patient just said: ${userTranscript}\n\nClinical AI Response:`

  try {
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: SONIC_MODEL,
        contentType: 'application/json',
        body: JSON.stringify({
          prompt,
          max_tokens: 500,
          temperature: 0.3,
          top_p: 0.9,
        }),
      })
    )

    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    return responseBody.content[0]?.text || 'Unable to process voice input'
  } catch (error) {
    console.error('[v0] Error processing voice input:', error)
    throw error
  }
}

/**
 * Transcribe audio to text (simulated - in production use AWS Transcribe)
 */
export async function transcribeAudio(audioBuffer: Buffer, sessionId: string): Promise<string> {
  // Note: In production, this would call AWS Transcribe Medical
  // For now, we're simulating with placeholder
  console.log('[v0] Transcribing audio for session:', sessionId)

  // Save audio to S3
  try {
    await saveAudioToS3(audioBuffer, sessionId)
  } catch (error) {
    console.error('[v0] Error saving audio:', error)
  }

  // In production, would integrate with AWS Transcribe Medical:
  // const transcribeClient = new TranscribeClient({ ... })
  // const result = await transcribeClient.send(new StartMedicalTranscriptionJobCommand({ ... }))

  return 'Audio transcribed - integration with AWS Transcribe Medical pending'
}

/**
 * Save audio recording to S3
 */
export async function saveAudioToS3(audioBuffer: Buffer, sessionId: string): Promise<string> {
  const timestamp = Date.now()
  const key = `sessions/${sessionId}/audio-${timestamp}.wav`

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || awsConfig.s3.bucket || 'noa-medical',
        Key: key,
        Body: audioBuffer,
        ContentType: 'audio/wav',
        Metadata: {
          sessionId,
          timestamp: timestamp.toString(),
        },
      })
    )

    return key
  } catch (error) {
    console.error('[v0] Error saving audio to S3:', error)
    throw error
  }
}

/**
 * Generate real-time clinical notes from voice session
 */
export async function generateRealTimeNotes(
  transcript: string,
  sessionContext: VoiceSessionState
): Promise<{
  keyFindings: string[]
  chiefComplaint: string
  assessmentSummary: string
}> {
  const prompt = `From this medical consultation transcript, extract:
1. Key clinical findings and symptoms
2. Chief complaint
3. Brief clinical assessment summary

Transcript:
${transcript}

Return as JSON:
{
  "keyFindings": ["Finding 1", "Finding 2", ...],
  "chiefComplaint": "Main complaint",
  "assessmentSummary": "Brief 1-2 sentence assessment"
}`

  try {
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: SONIC_MODEL,
        contentType: 'application/json',
        body: JSON.stringify({
          prompt,
          max_tokens: 400,
          temperature: 0.3,
        }),
      })
    )

    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    const text = responseBody.content[0]?.text || '{}'

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {
      keyFindings: [],
      chiefComplaint: 'Unable to extract',
      assessmentSummary: 'Unable to generate',
    }
  } catch (error) {
    console.error('[v0] Error generating real-time notes:', error)
    return {
      keyFindings: [],
      chiefComplaint: 'Error',
      assessmentSummary: 'Unable to process',
    }
  }
}

/**
 * Generate contextual clinical suggestions during consultation
 */
export async function getClinicaSuggestions(
  transcript: string,
  patientHistory: string,
  currentSymptoms: string
): Promise<string[]> {
  const prompt = `Based on the current consultation, provide 3-5 specific clinical suggestions for the doctor.

Patient History: ${patientHistory}
Current Symptoms: ${currentSymptoms}
Recent Transcript: ${transcript}

Provide actionable clinical suggestions as a JSON array:
["Suggestion 1", "Suggestion 2", "Suggestion 3"]`

  try {
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: SONIC_MODEL,
        contentType: 'application/json',
        body: JSON.stringify({
          prompt,
          max_tokens: 300,
          temperature: 0.4,
        }),
      })
    )

    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    const text = responseBody.content[0]?.text || '[]'

    const arrayMatch = text.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0])
    }

    return []
  } catch (error) {
    console.error('[v0] Error getting clinical suggestions:', error)
    return []
  }
}

/**
 * Sentiment and clinical urgency analysis from transcript
 */
export async function analyzeSessionSentiment(
  transcript: string
): Promise<{
  sentiment: 'positive' | 'neutral' | 'concerning'
  urgency: 'high' | 'medium' | 'low'
  concerns: string[]
}> {
  const prompt = `Analyze this medical consultation transcript for:
1. Overall patient sentiment (positive/neutral/concerning)
2. Clinical urgency level
3. Any expressed concerns or red flags

Transcript:
${transcript}

Respond as JSON:
{
  "sentiment": "positive|neutral|concerning",
  "urgency": "high|medium|low",
  "concerns": ["Concern 1", "Concern 2"]
}`

  try {
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: SONIC_MODEL,
        contentType: 'application/json',
        body: JSON.stringify({
          prompt,
          max_tokens: 300,
          temperature: 0.3,
        }),
      })
    )

    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    const text = responseBody.content[0]?.text || '{}'

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {
      sentiment: 'neutral',
      urgency: 'medium',
      concerns: [],
    }
  } catch (error) {
    console.error('[v0] Error analyzing session sentiment:', error)
    return {
      sentiment: 'neutral',
      urgency: 'medium',
      concerns: [],
    }
  }
}

export async function generateIntakeConversationTurn({
  transcript,
  language,
  history,
  draft,
}: {
  transcript: string
  language: string
  history: IntakeConversationMessage[]
  draft: IntakeConversationDraft
}): Promise<IntakeConversationResult> {
  const conversationHistory = history
    .slice(-12)
    .map(message => `${message.role}: ${message.content}`)
    .join('\n')

  const prompt = `You are Noa, a warm voice-first medical intake assistant.

Rules:
- Ask one concise question at a time.
- Keep the tone calm, clinical, and human.
- Support translation naturally: understand the user's language and respond in ${language}.
- If the user gives information in another language, normalize it into the intake JSON in English when useful, but keep the spoken assistant response in ${language}.
- Do not produce markdown.
- Return STRICT JSON only.

Current draft:
${JSON.stringify(draft)}

Conversation so far:
${conversationHistory || 'No prior conversation.'}

Latest user transcript:
${transcript}

Return JSON with this shape:
{
  "assistantMessage": "one short next question or acknowledgement in ${language}",
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
  "missingFields": ["firstName", "lastName"],
  "isComplete": false,
  "summary": "short summary of what has been captured so far in English"
}

Completion criteria:
- Mark isComplete true only when the intake has enough information to be clinically useful and the user has agreed to proceed.
- If consent has not been collected, ask for consent.
- Prefer asking for the biggest missing piece next.
- The latest user response may contain multiple answers; extract them.`

  try {
    const { text } = await invokeClinicalAI({
      prompt: `${prompt}\n\nIntake assistant response:`,
      maxTokens: 900,
      temperature: 0.2,
      modelTier: 'intake',
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text)

    return {
      assistantMessage: parsed.assistantMessage || 'Please tell me the next detail.',
      detectedLanguage: parsed.detectedLanguage || language,
      normalizedTranscript: parsed.normalizedTranscript || transcript,
      draft: parsed.draft || draft,
      missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
      isComplete: Boolean(parsed.isComplete),
      summary: parsed.summary || 'Intake captured.',
    }
  } catch (error) {
    console.error('[Voice Service] Error generating intake conversation turn:', error)
    throw error
  }
}

