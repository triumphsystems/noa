# System Architecture & Data Model

Comprehensive reference for Noa's application architecture, AWS Bedrock AI integration, DynamoDB single-table design, and real-time voice consultation pipeline.

---

## 1. High-Level Architecture

Noa is a Next.js (App Router) healthcare platform that combines generative AI clinical assistance, real-time voice streaming, and encrypted cloud storage.

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                      │
│        Doctor Dashboard · Patient Intake · Consultation UI  │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
┌──────▼──────┐         ┌──────▼──────┐         ┌──────▼──────┐
│ AWS Bedrock │         │AWS DynamoDB │         │   AWS S3    │
│  Nova/Sonic │         │ Single-Table│         │ Audio Store │
└─────────────┘         └─────────────┘         └─────────────┘
```

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Lucide icons, Zustand state stores.
- **Real-Time Voice**: Serverless rolling audio pipeline (`app/api/sessions/voice`) with 10s incremental chunks, browser Web Speech live feedback, and Bedrock Nova Sonic transcription.
- **Clinical AI Engine**: AWS Bedrock Runtime client (`lib/bedrock-nova.ts`) generating SOAP notes, triage priority, and diagnostic insights.
- **Persistence**: AWS DynamoDB single-table design (`lib/db.ts`) with on-demand capacity.
- **Media Storage**: AWS S3 bucket with AES-256 encryption and lifecycle archiving.
- **Extensibility**: Native Model Context Protocol server and in-browser integration (`docs/webmcp.md`).

---

## 2. AWS Bedrock AI Integration

Noa interfaces with AWS Bedrock via `@aws-sdk/client-bedrock-runtime` (`lib/aws-config.ts` and `lib/bedrock-nova.ts`).

### Model Roles

| Role | Bedrock Model | Purpose | Location |
|---|---|---|---|
| **Nova Lite** | `amazon.nova-lite-v2:0` | Low-latency clinical documentation: SOAP notes, patient-friendly summaries, triage assessments | `lib/bedrock-nova.ts` |
| **Nova Pro** | `amazon.nova-pro-v2:0` | Deep clinical intelligence: differential diagnoses, complex case recommendations, pattern recognition | `lib/bedrock-nova.ts` |
| **Sonic / Voice** | `amazon.nova-lite-v2:0` | Real-time consultation suggestions, live transcript evaluation, sentiment analysis | `lib/voice-service.ts` |

*(Fallback model IDs such as `us.anthropic.claude-3-5-sonnet-20241022` can be configured via environment variables if desired.)*

### Core AI Capabilities

1. **SOAP Note Generation** (`generateSOAPWithNova`):
   Transforms raw consultation transcripts and patient context into structured Subjective, Objective, Assessment, and Plan fields.
2. **Clinical Suggestions** (`getClinicalSuggestions` / `generateClinicalSuggestions`):
   Streams actionable suggestions and alerts (e.g. potential drug interactions or missing examinations) to the doctor during live consultations.
3. **Triage Priority** (`generateTriagePriority`):
   Evaluates chief complaints and symptoms, returning urgency ratings (Urgent, High, Medium, Low) and rationale.
4. **Diagnostic Insights** (`generateClinicalInsights`):
   Executes differential analysis on historical records, current presentations, and lab findings.

---

## 3. DynamoDB Single-Table Schema

Noa uses a single-table architecture named `noa-data` (configurable via `DYNAMODB_TABLE_NAME`).

### Table Keys

- **Partition Key (`PK`)**: `id` (String) — Unique entity identifier with prefix (e.g., `doctor-xxx`, `patient-xxx`)
- **Sort Key (`SK`)**: `type` (String) — Entity type discriminator (`doctor`, `patient`, `session`, `intake`)

### Global Secondary Indexes (GSIs)

All GSIs use `KEYS_ONLY` projection in Terraform for minimal storage overhead and cost:

| Index Name | Hash Key | Range Key | Access Pattern |
|---|---|---|---|
| **`email-index`** | `email` (S) | `type` (S) | Find doctor or patient account by email address |
| **`doctorId-index`** | `doctorId` (S) | `type` (S) | Query all patients or sessions belonging to a specific doctor |
| **`patientId-index`** | `patientId` (S) | `type` (S) | Query all consultation sessions or intake forms for a patient |

### Entity Definitions

#### 1. Doctor (`type: 'doctor'`)
```typescript
interface Doctor {
  id: string              // "doctor-{nanoid}"
  type: 'doctor'
  email: string           // Indexed via email-index
  name: string
  specialty: string
  license: string
  clinic: string
  phone?: string
  avatar?: string
  createdAt: number
  updatedAt: number
}
```

#### 2. Patient (`type: 'patient'`)
```typescript
interface Patient {
  id: string              // "patient-{nanoid}"
  type: 'patient'
  doctorId: string        // Indexed via doctorId-index
  email: string           // Indexed via email-index
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  address?: string
  allergies?: string[]
  medications?: string[]
  conditions?: string[]
  avatar?: string
  createdAt: number
  updatedAt: number
}
```

#### 3. Session (`type: 'session'`)
```typescript
interface Session {
  id: string              // "session-{nanoid}"
  type: 'session'
  doctorId: string        // Indexed via doctorId-index
  patientId: string       // Indexed via patientId-index
  startedAt: number
  endedAt?: number
  transcript?: string
  audioUrl?: string
  status: 'active' | 'completed' | 'archived'
  soapNote?: {
    subjective: string
    objective: string
    assessment: string
    plan: string
    generatedAt: number
  }
  createdAt: number
  updatedAt: number
}
```

#### 4. Patient Intake (`type: 'intake'`)
```typescript
interface PatientIntake {
  id: string              // "intake-{nanoid}"
  type: 'intake'
  patientId: string       // Indexed via patientId-index
  doctorId: string
  medicalHistory: string
  medications: string[]
  allergies: string[]
  surgeries?: string
  familyHistory?: string
  socialHistory?: string
  completed: boolean
  completedAt?: number
  createdAt: number
  updatedAt: number
}
```

### Data Access Operations (`lib/db.ts`)

- **Doctors**: `createDoctor`, `getDoctorById`, `getDoctorByEmail`, `updateDoctor`
- **Patients**: `createPatient`, `getPatientById`, `getPatientsByDoctor`, `updatePatient`
- **Sessions**: `createSession`, `getSessionById`, `getSessionsByDoctor`, `getSessionsByPatient`, `updateSession`
- **Intakes**: `createIntake`, `getIntakeById`, `getIntakesByPatient`, `updateIntake`

---

## 4. Audio Storage & S3 Structure

Audio recordings and consultation reports are stored in an S3 bucket (`AWS_S3_BUCKET`).

### Key Hierarchy
```
s3://<AWS_S3_BUCKET>/
├── audio/
│   └── sessions/{sessionId}/recording-{timestamp}.wav
├── transcripts/
│   └── sessions/{sessionId}/transcript.json
├── reports/
│   └── sessions/{sessionId}/soap-{timestamp}.pdf
└── backups/
```

- **Encryption**: Server-side AES-256 enabled by default.
- **Lifecycle Rules**: Provisioned by Terraform to transition older audio files to Glacier / Glacier Flexible Retrieval after 90 days, expiring after 365 days.
- **Public Access**: Fully blocked (`BlockPublicAcls`, `BlockPublicPolicy`, `IgnorePublicAcls`, `RestrictPublicBuckets`).

---

## 5. Real-Time Consultation & Serverless Voice Pipeline

The live consultation interface runs on a serverless-native rolling audio pipeline:

1. **Zero-Latency Live Transcription**: Browser Web Speech API provides instant, on-screen text transcription as the doctor and patient speak.
2. **Incremental Audio Chunking**: `MediaRecorder` captures rolling 10-second timeslices (~150KB per chunk), completely avoiding Vercel's 4.5MB serverless payload limit.
3. **Serverless Transcription & S3 Archival**: Each 10s chunk is streamed to `/api/sessions/voice`, persisted to S3, and transcribed via Amazon Bedrock Nova Sonic.
4. **Incremental DynamoDB Persistence**: Transcripts are automatically compiled into the session record in DynamoDB on each chunk, safeguarding against tab crashes or network drops.
5. **Mid-Consultation Clinical Suggestions**: Bedrock generates real-time differential diagnosis considerations and alerts as the conversation progresses.
6. **Instant Session Finalization**: Because the transcript is already assembled in DynamoDB throughout the call, generating the final structured SOAP note via Bedrock Nova Pro/Lite takes only 2–3 seconds when the doctor ends the session.
