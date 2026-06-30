import { invokeAIModel } from './ai-gateway-service'
import type { IntakeConversationMessage, IntakeConversationDraft, IntakeConversationResult } from './voice-types'

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
- If the user gives information in another language, normalize it into the intake JSON in English when useful.
- Do not produce markdown.
- Return STRICT JSON only.

Current draft:
${JSON.stringify(draft)}

Conversation:
${conversationHistory || 'No prior conversation.'}

Latest user transcript:
${transcript}

Return JSON:
{
  "assistantMessage": "one short next question or acknowledgement in ${language}",
  "detectedLanguage": "best guess language name",
  "normalizedTranscript": "clean English version of latest user response",
  "draft": {...},
  "missingFields": ["..."],
  "isComplete": false,
  "summary": "short summary in English"
}`

  try {
    console.log('[v0] Invoking AI Gateway with prompt length:', prompt.length)
    const text = await invokeAIModel(prompt, 900, 0.2)
    console.log('[v0] AI Gateway response:', text.substring(0, 200))
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.log('[v0] No JSON found in response. Full response:', text)
      throw new Error('Invalid response format from Bedrock')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    console.log('[v0] Successfully parsed response')

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
    console.error('[v0] Error in generateIntakeConversationTurn:', error instanceof Error ? error.message : error)
    if (error instanceof Error) console.error('[v0] Stack:', error.stack)
    return {
      assistantMessage: 'I missed that. Please speak more slowly.',
      detectedLanguage: language,
      normalizedTranscript: transcript,
      draft,
      missingFields: [],
      isComplete: false,
      summary: 'Unable to process.',
    }
  }
}
