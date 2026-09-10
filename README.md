# Noa

<p align="center">
  <strong>AI-Powered Clinical Intelligence Platform</strong>
</p>

<p align="center">
  Transforming medical consultations into structured, actionable medical records in real time, ambient voice processing, and autonomous clinical workflows.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/AWS-Bedrock%20%C2%B7%20DynamoDB%20%C2%B7%20Cognito-orange?style=flat-square&logo=amazon-aws" alt="AWS" />
  <img src="https://img.shields.io/badge/Security-HIPAA--Aligned-emerald?style=flat-square" alt="HIPAA Aligned" />
</p>

---

## What is Noa?

**Noa** is an ambient clinical intelligence platform designed to eliminate the documentation burden in modern healthcare. Clinicians spend hours each day manually entering consultation notes into Electronic Health Record (EHR) systems—time taken away from direct patient care.

Noa runs unobtrusively during clinical encounters. It ambiently captures natural dialogue between doctor and patient, synthesizes structured clinical notes (SOAP format), generates real-time differential suggestions, and automates patient intake questionnaires.

### Key Capabilities

- 🩺 **Ambient Clinical Scribing**  
  Passively captures doctor-patient consultations and automatically drafts comprehensive SOAP (Subjective, Objective, Assessment, Plan) notes in real time using Amazon Nova models.
- ⚡ **Real-Time Clinical Decision Support**  
  Surfaces live diagnostic prompts, potential drug interaction warnings, and differential considerations during the encounter without interrupting clinical rapport.
- 🗣️ **Interactive Voice Intake**  
  Conducts interactive, voice-driven pre-visit check-ins powered by Amazon Nova Sonic to capture chief complaints, symptom timelines, and medical history before the patient enters the exam room.
- 📋 **Patient-Friendly Care Summaries**  
  Translates complex clinical jargon into clear, accessible visit summaries and actionable care instructions for patients and their families.
- ⚖️ **Clinical Governance & Credentialing**  
  Provides an administrative workspace for medical license verification, credential auditing, and organizational privilege management.
- 🔌 **WebMCP Tool Integration**  
  Implements the Model Context Protocol (MCP) in the browser and server, providing structured tool calling, clinical resources, and standardized context exchange for AI models.

---

## Architecture

Noa uses a **Hybrid Multi-Model AI Architecture** that routes clinical tasks to the optimal model based on latency, reasoning depth, and modality:

```
                                  ┌────────────────────────┐
                                  │      Client Layer      │
                                  │         NextJS         │
                                  └───────────┬────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
                    ▼                                                   ▼
      ┌────────────────────────────┐                      ┌────────────────────────────┐
      │  React Server Components   │                      │       Server Actions       │
      │  Direct DynamoDB Streaming │                      │  Strict Mutations & RBAC   │
      └─────────────┬──────────────┘                      └─────────────┬──────────────┘
                    │                                                   │
                    └─────────────────────────┬─────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
         ┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
         │    AWS Bedrock     │    │    AWS DynamoDB    │    │    AWS Cognito     │
         │ Nova Lite · Nova   │    │ Single-Table Store │    │  RS256 JWT Verify  │
         │ Pro · Nova Sonic   │    │ Encryption at Rest │    │  RBAC Group Gate   │
         └────────────────────┘    └────────────────────┘    └────────────────────┘
```

### Model Allocation

| Model                 | Amazon Bedrock Identifier | Role & Responsibilities                                                                    |
| :-------------------- | :------------------------ | :----------------------------------------------------------------------------------------- |
| **Amazon Nova Sonic** | `amazon.nova-sonic-v1:0`  | Real-time bidirectional voice intake and speech-to-speech patient interaction.             |
| **Amazon Nova Lite**  | `amazon.nova-lite-v2:0`   | Low-latency live suggestions, intake field extraction, and triage assessments.             |
| **Amazon Nova Pro**   | `amazon.nova-pro-v2:0`    | In-depth SOAP synthesis, differential diagnosis reasoning, and complex clinical summaries. |

---

## Role-Based Access Control (RBAC)

Access is strictly partitioned using AWS Cognito RS256 token claims (`custom:user_type`):

| Role          | Landing Route        | Key Capabilities                                                                                                  |
| :------------ | :------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **`doctor`**  | `/dashboard/doctor`  | Live ambient recording, SOAP drafting, clinical history review, patient invitations, and consultation management. |
| **`patient`** | `/dashboard/patient` | Voice intake check-in, personal visit summaries, care team communication, and medical records access.             |
| **`admin`**   | `/dashboard/admin`   | Clinician license verification, compliance audit logging, credential reviews, and provider onboarding.            |

---

## Security, Privacy & Compliance

Noa is engineered with clinical-grade technical safeguards to protect Electronic Protected Health Information (ePHI) in alignment with HIPAA requirements:

- **End-to-End Encryption**  
  All data in transit is encrypted using TLS 1.3. Persistent clinical data is encrypted at rest using AWS KMS-managed AES-256 across DynamoDB tables and Amazon S3 buckets.
- **Access Control & Least Privilege**  
  Authentication is enforced via AWS Cognito with RS256 cryptographic signature verification. Backend operations adhere to AWS IAM least-privilege policies.
- **Secure Session Management**  
  Session tokens are transported via strictly partitioned `httpOnly`, `Secure`, and `SameSite=Strict` cookies, protecting against cross-site scripting (XSS) token extraction.
- **Clinical Data Integrity & Fail-Safe Architecture**  
  Clinical workflows enforce strict schema validation (Zod) and explicit error boundaries. If an AI service is unreachable, encounters transition gracefully into explicit manual review states rather than generating unverified or hallucinated documentation.
- **Audit Logging & Traceability**  
  Clinical record modifications, clinician credential reviews, and patient data accesses maintain immutable, timestamped audit entries via AWS CloudWatch.

---

## Quick Start

### 1. Prerequisites

- **Node.js 20+** and **pnpm 9+**
- **AWS Account** with access to Amazon Bedrock models (Nova Lite, Nova Pro, Nova Sonic), DynamoDB, S3, and Cognito.

### 2. Installation

```bash
git clone https://github.com/leoemaxie/noa.git
cd noa
pnpm install
```

### 3. Configure Environment

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Populate `.env.local` with your AWS credentials, Cognito user pool parameters, and Bedrock model IDs.

### 4. Seed Superadmin (Optional)

Initialize an administrative account for provider verification and governance:

```bash
pnpm seed:admin
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Project Structure

```
noa/
├── app/                      # Next.js 16 App Router
│   ├── auth/                 # Authentication flows (Sign in, registration, verification)
│   ├── dashboard/
│   │   ├── doctor/           # Clinician workspace, active consultations & patient records
│   │   ├── patient/          # Patient portal, care plans & consultation history
│   │   └── admin/            # Provider credential verification & clinical governance
│   ├── intake/               # Voice-assisted patient pre-visit intake
│   └── api/                  # Specialized APIs (WebMCP dispatcher & streaming endpoints)
├── components/               # Modular UI components (single-word naming)
│   ├── doctor/               # Clinician workspace components
│   ├── patient/              # Patient portal & care cards
│   ├── session/              # Consultation console, audio recorder & SOAP cards
│   ├── admin/                # Governance metrics, tables & approval dialogs
│   └── ui/                   # Shared UI component primitives
├── lib/
│   ├── ai/                   # AI provider wrappers and model definitions
│   ├── auth/                 # Server auth guards (requireServerAuth), JWT verification
│   ├── bedrock.ts            # AWS Bedrock runtime client
│   ├── data/                 # Direct DynamoDB data loaders for React Server Components
│   ├── db/                   # DynamoDB single-table client, types & queries
│   ├── voice/                # Voice processing and audio streaming services
│   └── webmcp/               # Model Context Protocol (MCP) tools, prompts & registry
├── scripts/                  # Administration and database seeding scripts
├── terraform/                # Infrastructure as Code (S3, DynamoDB, IAM, CloudWatch)
└── tests/                    # Automated unit and integration test suites
```

---

## Quality Assurance & Testing

Run the test suite using Node's native test runner:

```bash
# Run unit and integration tests
pnpm test

# Run TypeScript type checks
npx tsc --noEmit

# Code quality and formatting checks
pnpm lint
pnpm format:check
pnpm format
```

---

## Documentation

- [System Architecture & Data Model](./docs/architecture.md) — Detailed guide to the single-table DynamoDB schema and voice pipelines.
- [Deployment & Infrastructure Runbook](./docs/deployment.md) — Guide for provisioning AWS resources with Terraform and deploying to Vercel.
- [WebMCP Specification](./docs/webmcp.md) — Documentation for Model Context Protocol tools and browser integration.

---

## License

MIT © [Noa Health](https://github.com/leoemaxie/noa)
