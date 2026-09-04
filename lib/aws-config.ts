import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { S3Client } from '@aws-sdk/client-s3'
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'

export type AwsCredentials = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

let cachedOidcSession: {
  credentials: AwsCredentials
  expiresAt: number
} | null = null

/**
 * Exchange Vercel OIDC token with AWS STS for temporary credentials
 */
export async function getOidcCredentials(targetRegion = 'us-east-1'): Promise<AwsCredentials | undefined> {
  const oidcToken = process.env.VERCEL_OIDC_TOKEN
  const roleArn = process.env.AWS_ROLE_ARN

  if (!oidcToken || !roleArn) {
    return undefined
  }

  // Check cached credentials (buffered by 60 seconds)
  const now = Date.now()
  if (cachedOidcSession && cachedOidcSession.expiresAt > now + 60_000) {
    return cachedOidcSession.credentials
  }

  try {
    const stsEndpoint = targetRegion.startsWith('us-')
      ? 'https://sts.amazonaws.com'
      : `https://sts.${targetRegion}.amazonaws.com`

    const body = new URLSearchParams({
      Action: 'AssumeRoleWithWebIdentity',
      Version: '2011-06-15',
      RoleArn: roleArn,
      RoleSessionName: 'vercel-noa-session',
      WebIdentityToken: oidcToken,
      DurationSeconds: '900', // 15-minute rotation
    })

    const response = await fetch(stsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      console.error('[AWS OIDC] STS exchange failed:', await response.text())
      return undefined
    }

    const data = await response.json()
    const creds = data?.AssumeRoleWithWebIdentityResponse?.AssumeRoleWithWebIdentityResult?.Credentials
    if (!creds?.AccessKeyId || !creds?.SecretAccessKey) {
      return undefined
    }

    const result: AwsCredentials = {
      accessKeyId: creds.AccessKeyId,
      secretAccessKey: creds.SecretAccessKey,
      sessionToken: creds.SessionToken,
    }

    const expiresAt = creds.Expiration ? new Date(creds.Expiration).getTime() : now + 14 * 60_000
    cachedOidcSession = { credentials: result, expiresAt }
    return result
  } catch (err) {
    console.error('[AWS OIDC] Error exchanging token with AWS STS:', err)
    return undefined
  }
}

/**
 * Synchronously retrieves static credentials if present
 */
export function getAwsCredentials(_region?: string): AwsCredentials | undefined {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.AWS_SESSION_TOKEN

  if (!accessKeyId || !secretAccessKey) {
    return undefined
  }

  return {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {}),
  }
}

/**
 * Universal credential resolver supporting both Vercel OIDC and static keys
 */
export function createCredentialProvider(targetRegion: string) {
  return async (): Promise<AwsCredentials> => {
    // 1. Check static keys first (Local development or explicit env keys)
    const staticCreds = getAwsCredentials(targetRegion)
    if (staticCreds) {
      return staticCreds
    }

    // 2. Check Vercel OIDC (Production zero-key federation)
    if (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN) {
      const oidcCreds = await getOidcCredentials(targetRegion)
      if (oidcCreds) {
        return oidcCreds
      }
    }

    throw new Error(
      'No AWS credentials found. Configure VERCEL_OIDC_TOKEN + AWS_ROLE_ARN, or AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY.'
    )
  }
}

// ============================================
// AWS Region Configuration
// ============================================

const region = process.env.AWS_REGION || 'us-east-1'
const bedrockRegion = process.env.BEDROCK_REGION || region

// ============================================
// AWS Client Initialization (Dual-Mode: OIDC + Static Keys)
// ============================================

const hasCredentialsConfigured = Boolean(
  (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
  (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN)
)

// DynamoDB Client
export const dynamodbClient = new DynamoDBClient({
  region,
  ...(hasCredentialsConfigured ? { credentials: createCredentialProvider(region) } : {}),
})

// S3 Client (Terraform-provisioned)
export const s3Client = new S3Client({
  region,
  ...(hasCredentialsConfigured ? { credentials: createCredentialProvider(region) } : {}),
})

// Bedrock Runtime Client (for Nova & Sonic models with adaptive backoff)
export const bedrockClient = new BedrockRuntimeClient({
  region: bedrockRegion,
  maxAttempts: 5,
  retryMode: 'adaptive',
  ...(hasCredentialsConfigured ? { credentials: createCredentialProvider(bedrockRegion) } : {}),
})

// ============================================
// AWS Configuration Object
// ============================================

export const awsConfig = {
  // Region configuration
  region,
  bedrockRegion,
  accountId: process.env.AWS_ACCOUNT_ID,

  // DynamoDB Configuration (Terraform-provisioned)
  dynamodb: {
    tableName: process.env.DYNAMODB_TABLE_NAME || 'noa-data',
    partitionKey: process.env.DYNAMODB_TABLE_PARTITION_KEY || 'id',
  },

  // S3 Configuration (Terraform-provisioned)
  s3: {
    bucket: process.env.S3_BUCKET,
    backupBucket: process.env.S3_BACKUP_BUCKET,
    region,
    maxFileSize: parseInt(process.env.S3_MAX_FILE_SIZE || '52428800'), // 50MB default
    prefixes: {
      audio: 'audio/',
      transcripts: 'transcripts/',
      reports: 'reports/',
      backups: 'backups/',
    },
  },

  // Bedrock Configuration (Multiple models)
  bedrock: {
    region: bedrockRegion,
    models: {
      // Nova Lite v2 - Fast, efficient model for SOAP notes and basic tasks
      novaLite: process.env.BEDROCK_NOVA_LITE_MODEL || 'amazon.nova-lite-v2:0',
      
      // Nova Pro v2 - Advanced model for clinical analysis
      novaPro: process.env.BEDROCK_NOVA_PRO_MODEL || 'amazon.nova-pro-v2:0',
      
      // Sonic v2 - Voice/audio processing model
      sonic: process.env.BEDROCK_SONIC_MODEL || 'amazon.nova-sonic-v2:0',
    },
    config: {
      maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '2048'),
      temperature: parseFloat(process.env.BEDROCK_TEMPERATURE || '0.7'),
    },
  },

  // CloudWatch Logging (Optional)
  cloudwatch: {
    logGroup: process.env.CLOUDWATCH_LOG_GROUP,
    logRetention: parseInt(process.env.LOG_RETENTION_DAYS || '30'),
  },

  // Cognito Configuration
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
  },
}

// Validation function to check if AWS is properly configured
export function validateAwsConfig(): { valid: boolean; missing: string[] } {
  const required = [
    'AWS_REGION',
    'DYNAMODB_TABLE_NAME',
    'S3_BUCKET',
  ]

  // Either OIDC or static keys must be present
  const hasAuth = Boolean(
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
    (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN)
  )

  const missing = required.filter(key => !process.env[key])
  if (!hasAuth) {
    missing.push('AWS_ACCESS_KEY_ID or (VERCEL_OIDC_TOKEN + AWS_ROLE_ARN)')
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Export default config for convenience
export default awsConfig
