import { ConverseCommand, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { bedrockClient, s3Client, awsConfig } from './aws-config'
import { invokeClinicalAI } from '@/lib/ai/provider'

// Sonic model ID for real-time voice conversations
const SONIC_MODEL = process.env.BEDROCK_SONIC_MODEL || 'amazon.nova-sonic-v2:0'

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

  const prompt = `Doctor/Patient just said: ${userTranscript}\n\nClinical AI Response:`

  try {
    const { text } = await invokeClinicalAI({
      prompt,
      systemPrompt,
      maxTokens: 500,
      temperature: 0.3,
      modelTier: 'intake',
    })
    return text || 'Unable to process voice input'
  } catch (error) {
    console.error('[Voice] Error processing voice input:', error)
    throw error
  }
}

function detectAudioFormat(buffer: Buffer): 'wav' | 'mp3' | 'ogg' | 'flac' {
  if (buffer.length >= 4) {
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'wav'
    }
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      return 'mp3'
    }
    if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
      return 'ogg'
    }
    if (buffer[0] === 0x66 && buffer[1] === 0x4c && buffer[2] === 0x61 && buffer[3] === 0x43) {
      return 'flac'
    }
  }
  return 'wav'
}

/**
 * Transcribe consultation audio using Amazon Bedrock Nova Sonic / Multimodal audio model.
 * Archives the raw audio recording to S3 and returns the verbatim clinical transcription.
 */
export async function transcribeAudio(audioBuffer: Buffer, sessionId?: string): Promise<string> {
  const sid = sessionId || `session-${Date.now()}`
  console.log('[Bedrock] Transcribing consultation audio for session:', sid)

  // 1. Archive audio recording to S3
  try {
    await saveAudioToS3(audioBuffer, sid)
  } catch (error) {
    console.warn('[Bedrock] Warning: Could not archive audio recording to S3:', error)
  }

  const format = detectAudioFormat(audioBuffer)
  const systemInstruction =
    'You are an expert clinical transcription engine. Transcribe the spoken medical consultation in this audio recording accurately word-for-word. Return only the transcription text, with no preamble, filler, or markdown commentary.'

  // 2. First attempt: Bedrock Converse API with native audio content block
  try {
    const command = new ConverseCommand({
      modelId: SONIC_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              audio: {
                format,
                source: {
                  bytes: new Uint8Array(audioBuffer),
                },
              },
            } as any,
            {
              text: systemInstruction,
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.1,
      },
    })

    const response = await bedrockClient.send(command)
    const transcript = response.output?.message?.content?.[0]?.text?.trim()
    if (transcript) {
      return transcript
    }
  } catch (converseErr) {
    console.warn('[Bedrock] Converse API audio transcription attempt, trying InvokeModel fallback:', converseErr)
  }

  // 3. Fallback: Bedrock InvokeModel API with Base64 audio payload
  try {
    const payload = {
      messages: [
        {
          role: 'user',
          content: [
            {
              audio: {
                format,
                source: {
                  bytes: audioBuffer.toString('base64'),
                },
              },
            },
            {
              text: systemInstruction,
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.1,
      },
    }

    const invokeCmd = new InvokeModelCommand({
      modelId: SONIC_MODEL,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })

    const response = await bedrockClient.send(invokeCmd)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    const transcript =
      responseBody.output?.message?.content?.[0]?.text ||
      responseBody.content?.[0]?.text ||
      responseBody.text ||
      ''

    if (transcript.trim()) {
      return transcript.trim()
    }
  } catch (invokeErr) {
    console.error('[Bedrock] InvokeModel audio transcription error:', invokeErr)
    throw new Error(
      `Audio transcription failed via Bedrock [${SONIC_MODEL}]: ${
        invokeErr instanceof Error ? invokeErr.message : String(invokeErr)
      }`
    )
  }

  throw new Error(`Empty transcript returned by Bedrock audio model [${SONIC_MODEL}]`)
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
    console.error('Error saving audio to S3:', error)
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
    const { text } = await invokeClinicalAI({
      prompt,
      maxTokens: 400,
      temperature: 0.3,
      modelTier: 'intake',
    })

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
    console.error('[Voice] Error generating real-time notes:', error)
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
    const { text } = await invokeClinicalAI({
      prompt,
      maxTokens: 300,
      temperature: 0.4,
      modelTier: 'intake',
    })

    const arrayMatch = text.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0])
    }

    return []
  } catch (error) {
    console.error('[Voice] Error getting clinical suggestions:', error)
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
    const { text } = await invokeClinicalAI({
      prompt,
      maxTokens: 300,
      temperature: 0.3,
      modelTier: 'intake',
    })

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
    console.error('[Voice] Error analyzing session sentiment:', error)
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
