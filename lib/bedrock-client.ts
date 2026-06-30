import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getAwsCredentials } from './aws-config'

const region = process.env.AWS_REGION || 'us-east-1'
const bedrockCredentials = getAwsCredentials(region)
const s3Credentials = getAwsCredentials(region)

// Initialize clients - they will use SDK's default credential provider chain if no explicit creds
export const bedrockClient = new BedrockRuntimeClient({
  region,
  credentials: bedrockCredentials || undefined, // Explicitly pass undefined to use default chain
})

export const s3Client = new S3Client({
  region,
  credentials: s3Credentials || undefined, // Explicitly pass undefined to use default chain
})

export const SONIC_MODEL = 'anthropic.nova-sonic-v1:0'

export async function invokeBedrockModel(
  prompt: string,
  maxTokens: number = 500,
  temperature: number = 0.3
): Promise<string> {
  try {
    console.log('[v0] AWS Region:', region)
    console.log('[v0] Model ID:', SONIC_MODEL)
    console.log('[v0] Credentials available:', !!bedrockCredentials)
    
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: SONIC_MODEL,
        contentType: 'application/json',
        body: JSON.stringify({
          prompt,
          max_tokens: maxTokens,
          temperature,
          top_p: 0.9,
        }),
      })
    )

    console.log('[v0] Bedrock response status:', response.$metadata?.httpStatusCode)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    const result = responseBody.content[0]?.text || ''
    console.log('[v0] Extracted text length:', result.length)
    return result
  } catch (error) {
    console.error('[v0] Bedrock error:', error instanceof Error ? error.message : error)
    if (error instanceof Error) console.error('[v0] Stack:', error.stack)
    throw error
  }
}

export async function saveAudioToS3(audioBuffer: Buffer, sessionId: string): Promise<string> {
  const timestamp = Date.now()
  const key = `sessions/${sessionId}/audio-${timestamp}.wav`

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || 'noa-medical',
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
    console.error('[v0] Error saving audio:', error)
    throw error
  }
}
