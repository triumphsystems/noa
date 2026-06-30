import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { getAwsCredentials } from './aws-config'

const region = process.env.AWS_REGION || 'us-east-1'
const credentials = getAwsCredentials(region)

export const bedrockNovaClient = new BedrockRuntimeClient({
  region,
  ...(credentials ? { credentials } : {}),
})

export const NOVA_LITE_MODEL = 'anthropic.nova-lite-v1:0'
export const NOVA_PRO_MODEL = 'anthropic.nova-pro-v1:0'

export async function invokeNovaModel(
  modelId: string,
  prompt: string,
  maxTokens: number = 1000,
  temperature: number = 0.5
): Promise<string> {
  try {
    const response = await bedrockNovaClient.send(
      new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        body: JSON.stringify({
          prompt,
          max_tokens: maxTokens,
          temperature,
          top_p: 0.9,
        }),
      })
    )

    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    return responseBody.content[0]?.text || ''
  } catch (error) {
    console.error('[v0] Nova error:', error)
    throw error
  }
}

export function extractSection(text: string, section: string): string {
  const regex = new RegExp(`${section}:\\s*(.+?)(?=(?:SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN):|$)`, 'is')
  const match = text.match(regex)
  return match ? match[1].trim() : ''
}
