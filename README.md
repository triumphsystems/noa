# Noa

<p align="center">
  <strong>AI-Powered Ambient Clinical Intelligence Platform</strong>
</p>

<p align="center">
  Transforming medical consultations into structured, actionable clinical records in real time using AWS Bedrock, ambient voice processing, and autonomous clinical workflows.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/AWS-Bedrock%20%C2%B7%20DynamoDB%20%C2%B7%20Cognito-orange?style=flat-square&logo=amazon-aws" alt="AWS" />
  <img src="https://img.shields.io/badge/Compliance-HIPAA--Ready-emerald?style=flat-square" alt="HIPAA Ready" />
</p>

---

## Overview

**Noa** is an ambient clinical intelligence engine built for modern healthcare. During clinical encounters, Noa captures consultation dialogue, synthesizes structured SOAP notes with zero mock data, suggests real-time differential diagnoses, and streamlines interactive patient intake — enabling doctors to focus on care rather than documentation.

### Core Highlights

- 🩺 **Ambient Clinical Scribe** — Hands-free audio recording with multi-speaker diarization and automated SOAP note generation via Amazon Nova.
- ⚡ **Real-Time Clinical Suggestions** — Live, in-consultation diagnostic and differential prompts powered by Amazon Nova Lite.
- 🗣️ **Conversational Patient Intake** — Voice-driven intake questionnaire with Amazon Nova Sonic, loop-prevention, and clinical draft normalization.
- 🛡️ **Zero-Mock Safety & WebMCP** — Zero simulated fallbacks in clinical paths; model execution backed by WebMCP (Model Context Protocol).
- 🔐 **HIPAA-Ready Architecture** — Cryptographic RS256 token verification with AWS Cognito, IAM-enforced role access (`doctor`, `patient`, `admin`), and tamper-proof httpOnly session cookies.
- 🚀 **Next.js 16 & Server Actions** — Modern React 19 Server Components (RSC) and Server Action mutations for direct DynamoDB data streaming without boilerplate REST layers.

---

## Architecture

```
                                  ┌────────────────────────┐
                                  │      Client Layer      │
                                  │  React 19 / Tailwind   │
                                  └───────────┬────────────┘
                                              │
                   ┌──────────────────────────┴──────────────────────────┐
                   │                                                     │
                   ▼                                                     ▼
     ┌────────────────────────────┐                        ┌────────────────────────────┐
     │  React Server Components   │                        │       Server Actions       │
     │  Direct DynamoDB Streaming │                        │  Strict Mutations & RBAC   │
     └─────────────┬──────────────┘                        └─────────────┬──────────────┘
                   │                                                     │
                   └──────────────────────────┬──────────────────────────┘
                                              │
                   ┌──────────────────────────┼──────────────────────────┐
                   ▼                          ▼                          ▼
        ┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
        │    AWS Bedrock     │     │    AWS DynamoDB    │     │    AWS Cognito     │
        │ Nova Lite · Nova   │     │ Single-Table Store │     │  RS256 JWT Verify  │
        │ Pro · Nova Sonic   │     │  Encryption at Rest│     │  RBAC Groups Gate  │
        └────────────────────┘     └────────────────────┘     └────────────────────┘
```

---

## Quick Start

### 1. Prerequisites

- **Node.js 20+** and **pnpm 9+**
- **AWS Account** with active Bedrock model access (Amazon Nova Lite, Nova Pro, Sonic) and DynamoDB/Cognito permissions.

### 2. Installation

```bash
git clone https://github.com/leoemaxie/noa.git
cd noa
pnpm install
```

### 3. Configure Environment

Copy the example configuration:

```bash
cp .env.example .env.local
```

Populate `.env.local` with your AWS credentials and resource names:

```env
# AWS Core
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key

# DynamoDB
DYNAMODB_TABLE_NAME=noa-data

# AWS Bedrock
BEDROCK_REGION=us-east-1
BEDROCK_NOVA_LITE_MODEL=global.amazon.nova-2-lite-v1:0
BEDROCK_NOVA_PRO_MODEL=global.amazon.nova-pro-v1:0
BEDROCK_SONIC_MODEL=amazon.nova-2-sonic-v1:0

# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Seed Superadmin (Optional)

Provision the initial admin user and security groups in Cognito and DynamoDB:

```bash
pnpm seed:admin
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## Project Structure

```
noa/
├── app/                      # Next.js 16 App Router
│   ├── auth/                 # Sign in, registration & Cognito authentication
│   ├── dashboard/
│   │   ├── doctor/           # Doctor console, live sessions & patients registry
│   │   ├── patient/          # Patient portal, care team & medical history
│   │   └── admin/            # Superadmin clinical governance & credential verification
│   ├── intake/               # Voice-assisted patient intake flow
│   └── api/                  # Specialized APIs (WebMCP dispatcher & streaming voice)
├── components/               # Modular UI components (single-word naming)
│   ├── doctor/               # Clinician workspace components
│   ├── patient/              # Patient portal & care cards
│   ├── session/              # Consultation console, audio recorder & SOAP cards
│   ├── admin/                # Governance metrics, tables & approval dialogs
│   └── ui/                   # Primitive design system components
├── lib/
│   ├── auth/                 # Server auth guards (requireServerAuth), JWT verify & cookies
│   ├── bedrocks/             # Amazon Nova Lite, Nova Pro & Sonic AI provider engine
│   ├── data/                 # Direct DynamoDB RSC data loaders
│   ├── db/                   # DynamoDB client, types & query operations
│   └── webmcp/               # Model Context Protocol protocol & tools runtime
├── scripts/                  # Administrative and seeding CLI utilities
├── terraform/                # Infrastructure as Code (S3, DynamoDB, IAM)
└── tests/                    # Unit and integration test suites
```

---

## Development & Testing

Run the built-in Node test suite:

```bash
# Run all automated unit & integration tests
pnpm test

# Run TypeScript compilation check
npx tsc --noEmit

# Code quality and formatting
pnpm lint
pnpm format:check
pnpm format
```

---

## Role-Based Access Control (RBAC)

Noa utilizes deterministic, role-gated routes backed by AWS Cognito RS256 token claims (`custom:user_type`):

| Role          | Landing Route        | Key Capabilities                                                                                        |
| :------------ | :------------------- | :------------------------------------------------------------------------------------------------------ |
| **`doctor`**  | `/dashboard/doctor`  | Ambient recording, live consultation SOAP drafting, clinical history, patient invitations & care codes. |
| **`patient`** | `/dashboard/patient` | Voice intake questionnaire, clinical visit summaries, care team connection, medical records.            |
| **`admin`**   | `/dashboard/admin`   | Clinician licensure verification, credential audit log, clinical privilege management.                  |

---

## Security & Compliance

- **Data Protection** — TLS 1.3 in transit; AES-256 encryption at rest across DynamoDB and S3.
- **HIPAA-Ready Sessions** — Strictly partitioned authentication cookies (`httpOnly`, `secure`, `sameSite: strict`).
- **Zero-Mock Policy** — Production and staging workflows fail-fast if AWS Bedrock is unreachable rather than substituting synthesized clinical data.
- **Audit Logging** — All clinician verification actions and clinical notes record permanent audit timestamps and actor IDs.

---

## License

MIT © [Noa Health](https://github.com/leoemaxie/noa)
