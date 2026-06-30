import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getAwsCredentials } from './aws-config'

const region = process.env.AWS_REGION || 'us-east-1'
const bedrockCredentials = getAwsCredentials(region)
const s3Credentials = getAwsCredentials(region)

export const bedrockClient = new BedrockRuntimeClient({
  region,
  ...(bedrockCredentials ? { credentials: bedrockCredentials } : {}),
})

export const s3Client = new S3Client({
  region,
  ...(s3Credentials ? { credentials: s3Credentials } : {}),
})

export const SONIC_MODEL = 'anthropic.nova-sonic-v1:0'

export async function invokeBedrockModel(
  prompt: string,
  maxTokens: number = 500,
  temperature: number = 0.3
): Promise<string> {
  try {
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

    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    return responseBody.content[0]?.text || ''
  } catch (error) {
    console.error('[v0] Bedrock error:', error)
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
