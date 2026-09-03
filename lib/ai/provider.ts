/**
 * Unified Clinical AI Provider Engine
 * Golden Standard: AWS Bedrock (Nova Lite, Nova Pro, Sonic)
 * Local Alternative: Real Local LLM via OpenAI-compatible endpoint (e.g. Ollama)
 * 
 * Strict Clinical Safety: Zero mock data in production paths. Fails fast with typed errors.
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { getAwsCredentials, createCredentialProvider } from '@/lib/aws-config'

export type AIModelTier = 'fast' | 'reasoning' | 'intake'
export type AIProvider = 'bedrock' | 'local'

export class ClinicalAIUnavailableError extends Error {
  public isThrottling = false

  constructor(
    public provider: AIProvider,
    public model: string,
    public originalError?: unknown,
    public remediation?: string
  ) {
    const errorDetails = originalError instanceof Error ? originalError.message : String(originalError || '')
    const errorName = (originalError as any)?.name || ''
    const statusCode = (originalError as any)?.$metadata?.httpStatusCode

    super(
      `Clinical AI service unavailable via ${provider} [${model}]. ` +
      `${errorDetails ? `(${errorDetails}) ` : ''}` +
      `${remediation || 'Please verify service connectivity and credentials.'}`
    )
    this.name = 'ClinicalAIUnavailableError'

    if (errorName === 'ThrottlingException' || errorName === 'RequestLimitExceeded' || statusCode === 429) {
      this.isThrottling = true
    }
  }
}

interface InvokeParams {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  modelTier?: AIModelTier
}

interface InvokeResult {
  text: string
  provider: AIProvider
  model: string
}

// Bedrock client initialization
const region = process.env.AWS_REGION || 'us-east-1'
const hasCredentialsConfigured = Boolean(
  (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
  (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN)
)

const bedrockClient = new BedrockRuntimeClient({
  region,
  maxAttempts: 5,
  retryMode: 'adaptive',
  ...(hasCredentialsConfigured ? { credentials: createCredentialProvider(region) } : {}),
})

// Configuration getters
export function getActiveAIProvider(): AIProvider {
  const configured = (process.env.CLINICAL_AI_PROVIDER || 'bedrock').toLowerCase()
  return configured === 'local' ? 'local' : 'bedrock'
}

export function getModelForTier(provider: AIProvider, tier: AIModelTier = 'fast'): string {
  if (provider === 'local') {
    return process.env.LOCAL_AI_MODEL || 'llama3.2:latest'
  }

  // Bedrock Nova model mapping
  switch (tier) {
    case 'reasoning':
      return process.env.BEDROCK_NOVA_PRO_MODEL || 'anthropic.nova-pro-v1:0'
    case 'intake':
      return process.env.BEDROCK_SONIC_MODEL || 'amazon.nova-lite-v1:0'
    case 'fast':
    default:
      return process.env.BEDROCK_NOVA_LITE_MODEL || 'anthropic.nova-lite-v1:0'
  }
}

/**
 * Invoke Clinical AI via the configured provider (Bedrock or Local Ollama)
 * Never falls back to mock strings.
 */
export async function invokeClinicalAI({
  prompt,
  systemPrompt,
  maxTokens = 2000,
  temperature = 0.3,
  modelTier = 'fast',
}: InvokeParams): Promise<InvokeResult> {
  const provider = getActiveAIProvider()
  const model = getModelForTier(provider, modelTier)

  if (provider === 'local') {
    return invokeLocalAI({ prompt, systemPrompt, maxTokens, temperature, model })
  }

  return invokeBedrockAI({ prompt, systemPrompt, maxTokens, temperature, model })
}

/**
 * Invocation via AWS Bedrock (Nova models)
 */
async function invokeBedrockAI({
  prompt,
  systemPrompt,
  maxTokens,
  temperature,
  model,
}: {
  prompt: string
  systemPrompt?: string
  maxTokens: number
  temperature: number
  model: string
}): Promise<InvokeResult> {
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt

  try {
    const command = new InvokeModelCommand({
      modelId: model,
      contentType: 'application/json',
      body: JSON.stringify({
        prompt: fullPrompt,
        max_tokens: maxTokens,
        temperature,
        top_p: 0.9,
      }),
    })

    const response = await bedrockClient.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    const text = responseBody.content?.[0]?.text || responseBody.text || ''

    if (!text) {
      throw new Error('Empty response received from Bedrock model')
    }

    return {
      text,
      provider: 'bedrock',
      model,
    }
  } catch (error) {
    throw new ClinicalAIUnavailableError(
      'bedrock',
      model,
      error,
      'Check AWS IAM credentials, Bedrock model access permissions, or configure CLINICAL_AI_PROVIDER=local.'
    )
  }
}

/**
 * Invocation via Local LLM Server (Ollama / LocalAI / OpenAI-compatible endpoint)
 */
async function invokeLocalAI({
  prompt,
  systemPrompt,
  maxTokens,
  temperature,
  model,
}: {
  prompt: string
  systemPrompt?: string
  maxTokens: number
  temperature: number
  model: string
}): Promise<InvokeResult> {
  const endpoint = process.env.LOCAL_AI_ENDPOINT || 'http://localhost:11434/v1'
  const url = `${endpoint.replace(/\/+$/, '')}/chat/completions`

  const messages: Array<{ role: 'system' | 'user'; content: string }> = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: prompt })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    if (!text) {
      throw new Error('Empty response received from local LLM')
    }

    return {
      text,
      provider: 'local',
      model,
    }
  } catch (error) {
    throw new ClinicalAIUnavailableError(
      'local',
      model,
      error,
      `Ensure local LLM is running at ${endpoint} with model "${model}" (e.g. run "ollama run ${model}").`
    )
  }
}
