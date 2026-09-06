/**
 * Unified Clinical AI Provider Engine
 * Golden Standard: AWS Bedrock (Nova 2 Lite, Nova Pro, Nova 2 Sonic)
 * Local Alternative: Local LLM via OpenAI-compatible endpoint (e.g. Ollama)
 *
 * Architecture: Hybrid Tri-Model
 * - 'fast'        → Nova 2 Lite   (global.amazon.nova-2-lite-v1:0)  — SOAP extraction, suggestions, intake text
 * - 'reasoning'   → Nova Pro      (global.amazon.nova-pro-v1:0)     — Deep clinical reasoning, post-visit SOAP synthesis
 * - 'voice'       → Nova 2 Sonic  (amazon.nova-2-sonic-v1:0)        — Real-time bidirectional audio ONLY (WebSocket)
 *
 * IMPORTANT: Nova 2 Sonic does NOT support the Bedrock Converse/InvokeModel text APIs.
 * It is exclusively used via InvokeModelWithBidirectionalStream in app/api/voice/session/route.ts.
 * Do NOT pass 'voice' tier to invokeClinicalAI() — it will throw a hard error.
 *
 * Strict Clinical Safety: Fails fast with typed errors. Never falls back to mock strings.
 */

import {
  ConverseCommand,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient } from '@/lib/aws-config';

/**
 * Text-capable model tiers for invokeClinicalAI().
 * 'voice' is intentionally excluded — use the WebSocket route for Nova Sonic.
 */
export type AIModelTier = 'fast' | 'reasoning';

/** All tiers including voice (for model ID resolution only, not for invokeClinicalAI) */
export type AIModelTierFull = AIModelTier | 'voice';

export type AIProvider = 'bedrock' | 'local';

export class ClinicalAIUnavailableError extends Error {
  public isThrottling = false;

  constructor(
    public provider: AIProvider,
    public model: string,
    public originalError?: unknown,
    public remediation?: string
  ) {
    const errorDetails =
      originalError instanceof Error
        ? originalError.message
        : String(originalError || '');
    const errorName = (originalError as any)?.name || '';
    const statusCode = (originalError as any)?.$metadata?.httpStatusCode;

    super(
      `Clinical AI service unavailable via ${provider} [${model}]. ` +
        `${errorDetails ? `(${errorDetails}) ` : ''}` +
        `${remediation || 'Please verify service connectivity and credentials.'}`
    );
    this.name = 'ClinicalAIUnavailableError';

    if (
      errorName === 'ThrottlingException' ||
      errorName === 'RequestLimitExceeded' ||
      statusCode === 429
    ) {
      this.isThrottling = true;
    }
  }
}

interface InvokeParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  modelTier?: AIModelTier;
}

interface InvokeResult {
  text: string;
  provider: AIProvider;
  model: string;
}

// ============================================================
// Configuration Getters
// ============================================================

export function getActiveAIProvider(): AIProvider {
  const configured = (
    process.env.CLINICAL_AI_PROVIDER || 'bedrock'
  ).toLowerCase();
  return configured === 'local' ? 'local' : 'bedrock';
}

/**
 * Resolves the Bedrock model ID for a given tier.
 * 'voice' returns the Nova 2 Sonic ID — only for use with the bidirectional stream WebSocket route.
 */
export function getModelForTier(
  provider: AIProvider,
  tier: AIModelTierFull = 'fast'
): string {
  if (provider === 'local') {
    return process.env.LOCAL_AI_MODEL || 'llama3.2:latest';
  }

  switch (tier) {
    case 'reasoning':
      // Nova Pro — deep clinical reasoning, post-visit SOAP synthesis, ICD-10 coding
      return (
        process.env.BEDROCK_NOVA_PRO_MODEL || 'global.amazon.nova-pro-v1:0'
      );
    case 'voice':
      // Nova 2 Sonic — bidirectional audio ONLY via InvokeModelWithBidirectionalStream
      // DO NOT use this in invokeClinicalAI() — it will be rejected by Bedrock text APIs
      return process.env.BEDROCK_SONIC_MODEL || 'amazon.nova-2-sonic-v1:0';
    case 'fast':
    default:
      // Nova 2 Lite — fast clinical tasks, real-time suggestions, intake text extraction
      return (
        process.env.BEDROCK_NOVA_LITE_MODEL || 'global.amazon.nova-2-lite-v1:0'
      );
  }
}

/**
 * Returns the Nova 2 Sonic model ID. Use exclusively with the WebSocket bidirectional stream.
 * Exported as a named helper to make intent explicit at call sites.
 */
export function getSonicModelId(): string {
  return process.env.BEDROCK_SONIC_MODEL || 'amazon.nova-2-sonic-v1:0';
}

// ============================================================
// Text Invocation (Nova 2 Lite & Nova Pro only)
// ============================================================

/**
 * Invoke Clinical AI via the configured provider (Bedrock or Local Ollama).
 * Only accepts 'fast' (Nova 2 Lite) and 'reasoning' (Nova Pro) tiers.
 * Never use 'voice' here — Nova Sonic requires the WebSocket bidirectional stream.
 */
export async function invokeClinicalAI({
  prompt,
  systemPrompt,
  maxTokens = 2000,
  temperature = 0.3,
  modelTier = 'fast',
}: InvokeParams): Promise<InvokeResult> {
  const provider = getActiveAIProvider();
  const model = getModelForTier(provider, modelTier);

  if (provider === 'local') {
    return invokeLocalAI({
      prompt,
      systemPrompt,
      maxTokens,
      temperature,
      model,
    });
  }

  return invokeBedrockAI({
    prompt,
    systemPrompt,
    maxTokens,
    temperature,
    model,
  });
}

// ============================================================
// Bedrock Invocation (Nova 2 Lite & Nova Pro via Converse API)
// ============================================================

/**
 * Invocation via AWS Bedrock using the Converse API.
 * Compatible with Nova 2 Lite and Nova Pro (including cross-region inference profiles).
 * NOT compatible with Nova 2 Sonic — use InvokeModelWithBidirectionalStream instead.
 */
async function invokeBedrockAI({
  prompt,
  systemPrompt,
  maxTokens,
  temperature,
  model,
}: {
  prompt: string;
  systemPrompt?: string;
  maxTokens: number;
  temperature: number;
  model: string;
}): Promise<InvokeResult> {
  try {
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
    });

    const response = await bedrockClient.send(command);
    const text = response.output?.message?.content?.[0]?.text || '';

    if (!text) {
      throw new Error('Empty response received from Bedrock model');
    }

    return { text, provider: 'bedrock', model };
  } catch (error: any) {
    const errorName: string = error?.name || '';
    const statusCode: number = error?.$metadata?.httpStatusCode;

    // Throttling — re-throw immediately, do NOT retry (doubles latency & cost)
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
      );
    }

    // Compatibility fallback — try InvokeModel for older model variants
    const isCompatibilityError =
      errorName === 'UnsupportedOperationException' ||
      (errorName === 'ValidationException' && statusCode === 400);

    if (!isCompatibilityError) {
      throw new ClinicalAIUnavailableError('bedrock', model, error);
    }

    // Fallback: InvokeModel API
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      const isNova = model.includes('nova');
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
          };

      const invokeCmd = new InvokeModelCommand({
        modelId: model,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });

      const fallbackResponse = await bedrockClient.send(invokeCmd);
      const responseBody = JSON.parse(
        new TextDecoder().decode(fallbackResponse.body)
      );
      const text =
        responseBody.output?.message?.content?.[0]?.text ||
        responseBody.content?.[0]?.text ||
        responseBody.text ||
        '';

      if (text) {
        return { text, provider: 'bedrock', model };
      }

      throw new Error('Empty response from InvokeModel fallback');
    } catch (fallbackError: any) {
      throw new ClinicalAIUnavailableError(
        'bedrock',
        model,
        fallbackError,
        'Check AWS IAM credentials, Bedrock model access in AWS Console, or configure CLINICAL_AI_PROVIDER=local.'
      );
    }
  }
}

// ============================================================
// Local LLM Invocation (Ollama / LocalAI / OpenAI-compatible)
// ============================================================

async function invokeLocalAI({
  prompt,
  systemPrompt,
  maxTokens,
  temperature,
  model,
}: {
  prompt: string;
  systemPrompt?: string;
  maxTokens: number;
  temperature: number;
  model: string;
}): Promise<InvokeResult> {
  const endpoint = process.env.LOCAL_AI_ENDPOINT || 'http://localhost:11434/v1';
  const url = `${endpoint.replace(/\/+$/, '')}/chat/completions`;

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP ${response.status}: ${errorText || response.statusText}`
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    if (!text) {
      throw new Error('Empty response received from local LLM');
    }

    return { text, provider: 'local', model };
  } catch (error) {
    throw new ClinicalAIUnavailableError(
      'local',
      model,
      error,
      `Ensure local LLM is running at ${endpoint} with model "${model}" (e.g. run "ollama run ${model}").`
    );
  }
}
