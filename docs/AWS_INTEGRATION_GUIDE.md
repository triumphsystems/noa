# AWS Integration Guide - Noa Medical Platform

## Overview

This document details the complete AWS integration for the Noa medical platform, including DynamoDB, Bedrock (Nova & Sonic), S3, and Cognito setup.

## Required Environment Variables

### AWS Authentication
```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
DYNAMODB_TABLE_NAME=noa-db
DYNAMODB_TABLE_PARTITION_KEY=id
AWS_S3_BUCKET=noa-medical
```

### Bedrock Models
The platform uses three Bedrock models:

1. **Nova Lite** - For SOAP notes and clinical summaries
   - Model ID: `anthropic.nova-lite-v1:0`
   - Use cases: SOAP generation, patient summaries, triage decisions
   - Cost: Low (~$0.0015/1K input tokens)

2. **Nova Pro** - For advanced clinical intelligence
   - Model ID: `anthropic.nova-pro-v1:0`
   - Use cases: Clinical insights, complex case analysis
   - Cost: Medium (~$0.015/1K input tokens)

3. **Nova Sonic** - For real-time voice conversations
   - Model ID: `anthropic.nova-sonic-v1:0`
   - Use cases: Real-time clinical suggestions, voice transcription
   - Cost: Medium (~$0.015/1K input tokens)

## AWS Services Setup

### 1. DynamoDB Table Setup

Create a table with the following schema:

```
Table Name: noa-db
Partition Key: id (String)
Sort Key: type (String)

Global Secondary Indexes:
1. email-index
   - Partition Key: email
   - Projection: ALL

2. doctorId-index
   - Partition Key: doctorId
   - Sort Key: createdAt
   - Projection: ALL

3. patientId-index
   - Partition Key: patientId
   - Sort Key: createdAt
   - Projection: ALL
```

### 2. S3 Bucket Setup

Create bucket for storing audio and reports:

```
Bucket Name: noa-medical
Block Public Access: Enabled
Versioning: Enabled
Encryption: AES-256 or KMS
Folder Structure:
  /sessions/{sessionId}/audio-{timestamp}.wav
  /sessions/{sessionId}/reports/{filename}.pdf
  /patients/{patientId}/documents/
```

### 3. IAM Role Setup

Create an IAM role with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/noa-data*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::noa-medical/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*:*:foundation-model/*"
    }
  ]
}
```

### 4. Bedrock Model Access

Enable access to Bedrock models in your AWS region:

1. Go to AWS Console → Bedrock
2. Click "Model access" on the left sidebar
3. Request access to:
   - `anthropic.nova-lite-v1:0`
   - `anthropic.nova-pro-v1:0`
   - `anthropic.nova-sonic-v1:0`
4. Wait for access approval (usually instant)

### 5. Cognito Setup (Optional)

For production authentication:

```
User Pool: noa-medical
Attributes:
  - email (required, unique)
  - name (required)
  - phone_number
  - given_name
  - family_name
  - custom:userType (doctor or patient)
  - custom:specialty (for doctors)
  - custom:clinic (for doctors)

App Client:
  - Generate client ID and client secret
  - Set allowed OAuth flows
  - Configure callback URLs
```

## Data Models

### Doctor
```typescript
{
  id: "doctor-{uuid}",
  type: "doctor",
  email: "doctor@hospital.com",
  name: "Dr. John Smith",
  specialty: "Cardiology",
  clinic: "City Hospital",
  license: "LICENSE123",
  phone: "+1-555-0000",
  avatar: "https://s3.amazonaws.com/...",
  createdAt: 1719432000000,
  updatedAt: 1719432000000
}
```

### Patient
```typescript
{
  id: "patient-{uuid}",
  type: "patient",
  doctorId: "doctor-{uuid}",
  email: "patient@email.com",
  firstName: "John",
  lastName: "Doe",
  phone: "+1-555-0001",
  dateOfBirth: "1990-01-15",
  conditions: ["Hypertension", "Diabetes"],
  allergies: ["Penicillin"],
  medications: ["Lisinopril", "Metformin"],
  createdAt: 1719432000000,
  updatedAt: 1719432000000
}
```

### Session
```typescript
{
  id: "session-{uuid}",
  type: "session",
  doctorId: "doctor-{uuid}",
  patientId: "patient-{uuid}",
  startedAt: 1719432000000,
  endedAt: 1719435600000,
  status: "completed",
  transcript: "Full conversation transcript...",
  soapNote: {
    subjective: "...",
    objective: "...",
    assessment: "...",
    plan: "...",
    generatedAt: 1719435600000
  },
  realTimeNotes: {...},
  audioUrl: "s3://noa-medical/sessions/.../audio.wav",
  createdAt: 1719432000000,
  updatedAt: 1719432000000
}
```

### Intake
```typescript
{
  id: "intake-{uuid}",
  type: "intake",
  patientId: "patient-{uuid}",
  doctorId: "doctor-{uuid}",
  medicalHistory: "...",
  medications: [],
  allergies: [],
  surgeries: "...",
  familyHistory: "...",
  socialHistory: "...",
  completed: true,
  completedAt: 1719432000000,
  createdAt: 1719432000000,
  updatedAt: 1719432000000
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new doctor/patient
- `POST /api/auth/login` - Authenticate user

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions?doctorId={id}` - Get doctor's sessions
- `GET /api/sessions?patientId={id}` - Get patient's sessions
- `POST /api/sessions/voice` - Process voice input with Sonic

### Patients
- `GET /api/patients?doctorId={id}` - List doctor's patients
- `GET /api/patients/{id}` - Get patient details
- `POST /api/patients` - Create new patient

### Clinical Intelligence
- `POST /api/clinical/soap` - Generate SOAP notes (Nova Lite)
- `POST /api/clinical/insights` - Generate clinical insights (Nova Pro)
- `POST /api/clinical/suggestions` - Get real-time suggestions (Nova Sonic)
- `POST /api/clinical/triage` - Generate triage priority (Nova Lite)
- `POST /api/clinical/patient-summary` - Create patient-friendly summary

### Patient Intake
- `POST /api/intakes` - Submit intake form
- `GET /api/intakes?patientId={id}` - Get patient's intakes

## Real-Time Features

### WebSocket Events

The application uses Socket.io for real-time communication:

**Client → Server:**
- `join-session` - Join a voice consultation
- `transcript-update` - Send new transcript lines
- `audio-chunk` - Send audio data
- `get-suggestion` - Request clinical suggestions
- `start-recording` - Begin recording
- `stop-recording` - Stop recording
- `end-session` - Terminate session

**Server → Client:**
- `session-joined` - Confirmation of session join
- `transcript-updated` - Broadcast new transcript
- `audio-received` - Broadcast audio to participants
- `suggestion-generated` - Clinical suggestions from Nova
- `recording-started` - Recording confirmation
- `recording-stopped` - Recording stopped
- `session-ending` - Session termination

## Testing the Integration

### 1. Test DynamoDB Connection
```bash
# Create test doctor
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hospital.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "Doctor",
    "userType": "doctor",
    "specialty": "Cardiology",
    "clinic": "Test Hospital"
  }'
```

### 2. Test Nova SOAP Generation
```bash
curl -X POST http://localhost:3000/api/clinical/soap \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Doctor: How are you feeling today? Patient: I have a headache and fever since yesterday.",
    "patientInfo": "34-year-old male, no known allergies"
  }'
```

### 3. Test Bedrock Models
```bash
curl -X POST http://localhost:3000/api/clinical/insights \
  -H "Content-Type: application/json" \
  -d '{
    "patientHistory": "Type 2 diabetes, hypertension",
    "currentPresentation": "Patient reports chest pain and shortness of breath for 2 hours",
    "previousFindings": "ECG from 6 months ago was normal"
  }'
```

## Monitoring and Logging

### CloudWatch Logs
All Lambda functions and API calls log to CloudWatch:
- `/aws/lambda/noa-bedrock`
- `/aws/lambda/noa-dynamodb`

### DynamoDB Monitoring
- Enable CloudWatch metrics
- Set up alarms for:
  - Throttled read/write capacity
  - User errors
  - System errors

### Bedrock Usage
- Monitor API calls via CloudWatch
- Track token usage per model
- Set up cost alerts

## Security Best Practices

1. **Encryption**
   - Enable encryption at rest for DynamoDB
   - Use KMS for S3 bucket encryption
   - Use HTTPS for all API calls

2. **Access Control**
   - Use IAM roles instead of long-term credentials
   - Enable OIDC for Vercel integration
   - Implement row-level security in queries

3. **Audit Logging**
   - Enable CloudTrail for all API calls
   - Log all PHI access
   - Implement audit trails in application

4. **HIPAA Compliance**
   - Enable DynamoDB encryption
   - Use VPC endpoints for S3 and DynamoDB
   - Implement access logging
   - Enable MFA for AWS console access

## Troubleshooting

### "InvalidSignatureException" Error
- Verify AWS credentials in environment
- Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct
- Ensure the AWS principal has proper permissions

### "ValidationException" from Bedrock
- Check model ID is correct
- Verify model access is enabled
- Check token limits (usually 2000-4000 tokens)

### DynamoDB Query Returns Empty
- Verify table name in environment
- Check partition/sort key values
- Ensure GSI is properly configured

### WebSocket Connection Fails
- Verify Socket.io server is running
- Check CORS settings
- Ensure WebSocket port is open

## Performance Optimization

1. **DynamoDB**
   - Use batch operations for multiple items
   - Enable DynamoDB streams for real-time updates
   - Set appropriate TTL for session data

2. **Bedrock**
   - Cache common prompts/responses
   - Use batch inference when possible
   - Implement request queuing

3. **S3**
   - Use S3 Transfer Acceleration for faster uploads
   - Implement multipart uploads for large files
   - Use CloudFront for audio file distribution

## Cost Estimation (Monthly)

- **DynamoDB**: ~$25-50 (1M requests/month)
- **Bedrock**: ~$50-200 (1M tokens/month)
- **S3**: ~$10-30 (100GB storage)
- **Cognito**: Free (first 50k users)
- **Total**: ~$100-300/month

## Next Steps

1. ✅ Set up AWS region and IAM
2. ✅ Create DynamoDB table
3. ✅ Request Bedrock model access
4. ✅ Create S3 bucket
5. ✅ Deploy Lambda functions
6. ✅ Configure Cognito (optional)
7. ✅ Set up monitoring/logging
8. ✅ Test all integrations
9. ✅ Enable HIPAA compliance features
10. ✅ Go live!
