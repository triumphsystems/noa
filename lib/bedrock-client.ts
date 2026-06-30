import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { CredentialsProvider } from '@aws-sdk/types'

const region = process.env.AWS_REGION || 'us-east-1'
const bedrockRoleArn = process.env.BEDROCK_ROLE_ARN
const bedrockRoleName = process.env.BEDROCK_ROLE_NAME

// Create a custom credentials provider that assumes the Bedrock role
function createBedrockCredentialsProvider(): CredentialsProvider {
  return async () => {
    try {
      if (!bedrockRoleArn) {
        throw new Error('BEDROCK_ROLE_ARN environment variable is not set')
      }

      const stsClient = new STSClient({ region })
      const command = new AssumeRoleCommand({
        RoleArn: bedrockRoleArn,
        RoleSessionName: bedrockRoleName || 'noa-bedrock-session',
        DurationSeconds: 3600,
      })
      const response = await stsClient.send(command)
      
      console.log('[v0] Successfully assumed Bedrock role')
      return {
        accessKeyId: response.Credentials!.AccessKeyId!,
        secretAccessKey: response.Credentials!.SecretAccessKey!,
        sessionToken: response.Credentials!.SessionToken,
      }
    } catch (error) {
      console.error('[v0] Failed to assume Bedrock role:', error instanceof Error ? error.message : error)
      throw new Error(`Bedrock IAM authentication failed: ${error instanceof Error ? error.message : error}`)
    }
  }
}

// Initialize clients - Bedrock will use the assumed role credentials
export const bedrockClient = new BedrockRuntimeClient({
  region,
  credentials: createBedrockCredentialsProvider(),
})

export const s3Client = new S3Client({
  region,
  credentials: createBedrockCredentialsProvider(),
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
    console.error('[v0] Bedrock error:', error instanceof Error ? error.message : error)
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
