/**
 * Unified Clinical AI Provider Engine
 * Golden Standard: AWS Bedrock (Nova Lite, Nova Pro, Sonic)
 * Local Alternative: Local LLM via OpenAI-compatible endpoint (e.g. Ollama)
 *
 * Strict Clinical Safety: Fails fast with typed errors.
 */

import { ConverseCommand, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { bedrockClient } from '@/lib/aws-config'

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

// Configuration getters
export function getActiveAIProvider(): AIProvider {
  const configured = (process.env.CLINICAL_AI_PROVIDER || 'bedrock').toLowerCase()
  return configured === 'local' ? 'local' : 'bedrock'
}

export function getModelForTier(provider: AIProvider, tier: AIModelTier = 'fast'): string {
  if (provider === 'local') {
    return process.env.LOCAL_AI_MODEL || 'llama3.2:latest'
  }

  // Bedrock Nova v2 model mapping (supports direct or cross-region inference profiles)
  switch (tier) {
    case 'reasoning':
      return process.env.BEDROCK_NOVA_PRO_MODEL || 'amazon.nova-pro-v2:0'
    case 'intake':
      return process.env.BEDROCK_SONIC_MODEL || 'amazon.nova-sonic-v2:0'
    case 'fast':
    default:
      return process.env.BEDROCK_NOVA_LITE_MODEL || 'amazon.nova-lite-v2:0'
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
  try {
    // Bedrock Converse API provides uniform support across Nova, Claude, and Cross-Region inference profiles
    const command = new ConverseCommand({
      modelId: model,
      messages: [
        {
          role: 'user',
          content: [{ text: prompt }],
        },
      ],
      system: systemPrompt ? [{ text: systemPrompt }] : undefined,
      inferenceConfig: {
        maxTokens,
        temperature,
        topP: 0.9,
      },
    })

    const response = await bedrockClient.send(command)
    const text = response.output?.message?.content?.[0]?.text || ''

    if (!text) {
      throw new Error('Empty response received from Bedrock model')
    }

    return {
      text,
      provider: 'bedrock',
      model,
    }
  } catch (error: any) {
    const errorName: string = error?.name || ''
    const statusCode: number = error?.$metadata?.httpStatusCode

    // Re-throw immediately for throttling and network errors — do NOT retry,
    // as that doubles latency and cost with no benefit
    if (
      errorName === 'ThrottlingException' ||
      errorName === 'RequestLimitExceeded' ||
      statusCode === 429 ||
      errorName === 'ServiceUnavailableException' ||
      statusCode === 503
    ) {
      throw new ClinicalAIUnavailableError(
        'bedrock',
        model,
        error,
        'AWS Bedrock is throttling requests. Please retry in a few moments.'
      )
    }

    // Only fall back to InvokeModelCommand for model-compatibility errors
    // (e.g. model doesn't support the Converse API yet)
    const isCompatibilityError =
      errorName === 'UnsupportedOperationException' ||
      errorName === 'ValidationException' ||
      statusCode === 400

    if (!isCompatibilityError) {
      throw new ClinicalAIUnavailableError('bedrock', model, error)
    }

    // Fallback: Bedrock InvokeModel API for models that don't support Converse
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
      const isNova = model.includes('nova')
      const payload = isNova
        ? {
            messages: [{ role: 'user', content: [{ text: fullPrompt }] }],
            ...(systemPrompt ? { system: [{ text: systemPrompt }] } : {}),
            inferenceConfig: { maxTokens, temperature, topP: 0.9 },
          }
        : {
            prompt: fullPrompt,
            max_tokens: maxTokens,
            temperature,
            top_p: 0.9,
          }

      const invokeCmd = new InvokeModelCommand({
        modelId: model,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      })

      const fallbackResponse = await bedrockClient.send(invokeCmd)
      const responseBody = JSON.parse(new TextDecoder().decode(fallbackResponse.body))
      const text =
        responseBody.output?.message?.content?.[0]?.text ||
        responseBody.content?.[0]?.text ||
        responseBody.text ||
        ''

      if (text) {
        return { text, provider: 'bedrock', model }
      }

      throw new Error('Empty response from InvokeModel fallback')
    } catch (fallbackError: any) {
      throw new ClinicalAIUnavailableError(
        'bedrock',
        model,
        fallbackError,
        'Check AWS IAM credentials, Bedrock cross-region inference profiles, model access in AWS Console, or configure CLINICAL_AI_PROVIDER=local.'
      )
    }
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
