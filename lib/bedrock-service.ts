import { BedrockRuntimeClient, ConverseCommand, Message } from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' })

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Generate clinical insights from transcribed consultation
 */
export async function generateClinicalInsights(transcript: string): Promise<string> {
  const systemPrompt = `You are an expert clinical AI assistant. Your role is to analyze medical consultations and provide structured clinical insights. 

When analyzing consultations:
1. Extract key clinical findings
2. Identify relevant medical conditions
3. Suggest appropriate clinical next steps
4. Flag any critical information

Format your responses clearly with sections for Subjective, Objective, Assessment, and Plan (SOAP format).`

  try {
    const response = await client.send(
      new ConverseCommand({
        modelId: 'us.anthropic.claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'user',
            content: `Please analyze the following medical consultation transcript and provide clinical insights:\n\n${transcript}`,
          },
        ],
        system: systemPrompt,
        maxTokens: 2048,
      })
    )

    // Extract text content from response
    const textContent = response.output?.message?.content?.find((block) => block.text)?.text
    return textContent || 'Unable to generate clinical insights'
  } catch (error) {
    console.error('[v0] Error generating clinical insights:', error)
    throw error
  }
}

/**
 * Generate SOAP note from consultation data
 */
export async function generateSOAPNote(transcript: string, patientInfo: string): Promise<{
  subjective: string
  objective: string
  assessment: string
  plan: string
}> {
  const systemPrompt = `You are a medical documentation expert. Create a structured SOAP note based on the consultation.

Return ONLY a JSON object with these exact fields:
{
  "subjective": "Patient's description of symptoms and history",
  "objective": "Clinical findings and vital signs",
  "assessment": "Clinical impression and diagnoses",
  "plan": "Treatment plan and follow-up"
}

Do not include any text outside the JSON object.`

  try {
    const response = await client.send(
      new ConverseCommand({
        modelId: 'us.anthropic.claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'user',
            content: `Generate a SOAP note from this consultation:\n\nPatient Info: ${patientInfo}\n\nTranscript:\n${transcript}`,
          },
        ],
        system: systemPrompt,
        maxTokens: 1024,
      })
    )

    const textContent = response.output?.message?.content?.find((block) => block.text)?.text
    if (!textContent) {
      throw new Error('No response from model')
    }

    // Parse JSON response
    const soapNote = JSON.parse(textContent)
    return soapNote
  } catch (error) {
    console.error('[v0] Error generating SOAP note:', error)
    throw error
  }
}

/**
 * Multi-turn conversation for clinical discussion
 */
export async function clinicalConversation(messages: ConversationMessage[]): Promise<string> {
  const systemPrompt = `You are a clinical AI assistant in a medical consultation. Provide helpful, accurate medical information while maintaining HIPAA compliance.

Guidelines:
- Provide evidence-based medical information
- Ask clarifying questions when needed
- Summarize key points periodically
- Suggest documentation points`

  try {
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    const response = await client.send(
      new ConverseCommand({
        modelId: 'us.anthropic.claude-3-5-sonnet-20241022',
        messages: formattedMessages,
        system: systemPrompt,
        maxTokens: 512,
      })
    )

    const textContent = response.output?.message?.content?.find((block) => block.text)?.text
    return textContent || 'Unable to generate response'
  } catch (error) {
    console.error('[v0] Error in clinical conversation:', error)
    throw error
  }
}

/**
 * Transcribe audio using Bedrock (stub - would use Amazon Transcribe in production)
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  // In production, this would use Amazon Transcribe
  // For now, returning a mock transcription
  console.log('[v0] Transcription placeholder - would use Amazon Transcribe service')
  return 'Mock transcription: Patient reports normal symptoms. No concerns raised.'
}

/**
 * Generate patient summary for sharing
 */
export async function generatePatientSummary(soapNote: {
  subjective: string
  objective: string
  assessment: string
  plan: string
}): Promise<string> {
  const systemPrompt = `You are a medical writer. Create a clear, patient-friendly summary of a clinical visit.

Use simple language and explain medical terms. Focus on:
1. What was discussed
2. What tests/exams were done
3. The diagnosis/assessment
4. What happens next

Make it understandable for patients without medical background.`

  try {
    const noteText = `
Subjective: ${soapNote.subjective}
Objective: ${soapNote.objective}
Assessment: ${soapNote.assessment}
Plan: ${soapNote.plan}
`

    const response = await client.send(
      new ConverseCommand({
        modelId: 'us.anthropic.claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'user',
            content: `Create a patient-friendly summary of this clinical visit:\n${noteText}`,
          },
        ],
        system: systemPrompt,
        maxTokens: 512,
      })
    )

    const textContent = response.output?.message?.content?.find((block) => block.text)?.text
    return textContent || 'Unable to generate summary'
  } catch (error) {
    console.error('[v0] Error generating patient summary:', error)
    throw error
  }
}
