import { generateText } from 'ai'

const AI_GATEWAY_URL = 'https://api.vercel.com/v1'

/**
 * Invoke AI model via Vercel AI Gateway
 * Uses Claude 3.5 Sonnet by default, with fallback to another model
 */
export async function invokeAIModel(
  prompt: string,
  maxTokens: number = 500,
  temperature: number = 0.3
): Promise<string> {
  try {
    console.log('[v0] Invoking AI Gateway model')
    
    const { text } = await generateText({
      model: 'anthropic.claude-3-5-sonnet-20241022',
      prompt,
      maxTokens,
      temperature,
      system: 'You are a helpful medical intake assistant.',
    })

    console.log('[v0] AI Gateway response received, length:', text.length)
    return text
  } catch (error) {
    console.error('[v0] AI Gateway error:', error instanceof Error ? error.message : error)
    throw error
  }
}
