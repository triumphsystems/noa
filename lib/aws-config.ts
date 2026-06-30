import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { S3Client } from '@aws-sdk/client-s3'
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'

export type AwsCredentials = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

export function getAwsCredentials(_region?: string): AwsCredentials | undefined {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.AWS_SESSION_TOKEN

  // If explicit credentials are provided, use them
  if (accessKeyId && secretAccessKey) {
    return {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    }
  }

  // If no explicit credentials but we have environment setup (e.g., from Vercel/DynamoDB integration)
  // allow SDK to use default credential provider chain (includes IAM role, environment variables, etc.)
  if (process.env.AWS_REGION && (process.env.AWS_ROLE_ARN || process.env.AWS_ACCOUNT_ID)) {
    console.log('[v0] Using default AWS credential provider chain (IAM role or environment)')
    return undefined // Let SDK handle credential resolution
  }

  return undefined
}

// ============================================
// AWS Region Configuration
// ============================================

const region = process.env.AWS_REGION || 'us-east-1'
const bedrockRegion = process.env.BEDROCK_REGION || region

// ============================================
// AWS Client Initialization
// ============================================

// DynamoDB Client
export const dynamodbClient = new DynamoDBClient({
  region,
  ...(getAwsCredentials(region) ? { credentials: getAwsCredentials(region) } : {}),
})

// S3 Client (Terraform-provisioned)
export const s3Client = new S3Client({
  region,
  ...(getAwsCredentials(region) ? { credentials: getAwsCredentials(region) } : {}),
})

// Bedrock Runtime Client (for Nova & Sonic models)
export const bedrockClient = new BedrockRuntimeClient({
  region: bedrockRegion,
  ...(getAwsCredentials(bedrockRegion) ? { credentials: getAwsCredentials(bedrockRegion) } : {}),
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
      // Nova Lite - Fast, efficient model for SOAP notes and basic tasks
      novaLite: process.env.BEDROCK_NOVA_LITE_MODEL || 'us.anthropic.claude-3-5-sonnet-20241022',
      
      // Nova Pro - Advanced model for clinical analysis
      novaPro: process.env.BEDROCK_NOVA_PRO_MODEL || 'us.anthropic.claude-3-5-sonnet-20241022',
      
      // Sonic - Voice/audio processing model
      sonic: process.env.BEDROCK_SONIC_MODEL || 'amazon.nova-lite-v1:0',
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

  // Application Configuration
  app: {
    environment: process.env.NODE_ENV || 'production',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // Feature Flags
  features: {
    voiceRecording: process.env.ENABLE_VOICE_RECORDING !== 'false',
    realtimeSuggestions: process.env.ENABLE_REALTIME_SUGGESTIONS !== 'false',
    autoSoapGeneration: process.env.ENABLE_AUTO_SOAP_GENERATION !== 'false',
    patientIntake: process.env.ENABLE_PATIENT_INTAKE !== 'false',
    clinicalInsights: process.env.ENABLE_CLINICAL_INSIGHTS !== 'false',
  },
}

// ============================================
// Validation
// ============================================

// Validate required environment variables
const requiredVars = [
  'AWS_REGION',
  'AWS_ACCOUNT_ID',
  'DYNAMODB_TABLE_NAME',
  'S3_BUCKET',
]

if (process.env.NODE_ENV === 'production') {
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`[v0] ERROR: Missing required environment variable: ${varName}`)
    }
  }
}

// Log configuration (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('[v0] AWS Configuration loaded:', {
    region,
    bedrockRegion,
    s3Bucket: process.env.S3_BUCKET,
    dynamodbTable: process.env.DYNAMODB_TABLE_NAME,
  })
}

export default awsConfig
