import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { S3Client } from '@aws-sdk/client-s3'
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'

const region = process.env.AWS_REGION || 'us-east-1'

export const cognitoClient = new CognitoIdentityProviderClient({ region })
export const dynamodbClient = new DynamoDBClient({ region })
export const s3Client = new S3Client({ region })
export const bedrockClient = new BedrockRuntimeClient({ region })

export const awsConfig = {
  region,
  cognito: {
    userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    clientId: process.env.AWS_COGNITO_CLIENT_ID,
    domain: process.env.AWS_COGNITO_DOMAIN,
  },
  dynamodb: {
    tables: {
      doctors: process.env.AWS_DYNAMODB_DOCTORS_TABLE || 'noa-doctors',
      patients: process.env.AWS_DYNAMODB_PATIENTS_TABLE || 'noa-patients',
      sessions: process.env.AWS_DYNAMODB_SESSIONS_TABLE || 'noa-sessions',
      intakes: process.env.AWS_DYNAMODB_INTAKES_TABLE || 'noa-intakes',
    },
  },
  s3: {
    bucket: process.env.AWS_S3_BUCKET_NAME,
    audioPrefix: 'audio/',
    reportsPrefix: 'reports/',
  },
  bedrock: {
    models: {
      converse: 'us.anthropic.claude-3-5-sonnet-20241022',
      voiceChat: 'us.amazon.nova-lite-v1:0',
    },
  },
}
