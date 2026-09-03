# Noa — AI-Powered Medical Intelligence Platform

Noa transforms medical consultations into structured clinical intelligence using AWS Bedrock (Nova & Sonic), real-time voice processing, and automated SOAP note generation.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Infrastructure Setup](#infrastructure-setup)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Security](#security)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Doctor Dashboard** — Real-time session management, patient directory, and clinical summaries
- **Voice Consultations** — Live audio recording with automatic transcription via AWS Bedrock Sonic
- **SOAP Note Generation** — Automatic notes from consultation transcripts using Nova Lite
- **Clinical Suggestions** — Real-time AI recommendations during active consultations
- **Patient Management** — Full patient profiles, medical history, intake forms, and session records
- **Advanced Analysis** — Differential diagnosis and pattern recognition via Nova Pro
- **Secure by Design** — HIPAA-ready architecture with encryption, audit logging, and RBAC

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel / Next.js Frontend                │
│         Doctor Dashboard · Patient Portals · Real-time UI   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Next.js API Routes & WebSocket                 │
│        Auth · Session Management · Clinical Processing      │
└────┬─────────────┬──────────────┬────────────┬─────────────┘
     │             │              │            │
  ┌──▼──┐      ┌───▼───┐     ┌───▼──┐    ┌────▼────┐
  │ S3  │      │Bedrock│     │  IAM │    │DynamoDB │
  │Audio│      │Nova · │     │ Auth │    │  Data   │
  │Store│      │Sonic  │     │      │    │         │
  └─────┘      └───────┘     └──────┘    └─────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| State | Zustand |
| Real-time | Socket.io |
| Data Fetching | SWR |
| Database | AWS DynamoDB (on-demand, Terraform-provisioned) |
| Storage | AWS S3 (Terraform-provisioned) |
| AI / Voice | AWS Bedrock — Nova Lite, Nova Pro, Sonic |
| Infrastructure | Terraform, Vercel, AWS CloudWatch, AWS IAM (OIDC) |
| Audio | react-mic, wav-encoder |

## Prerequisites

- Node.js 20+, pnpm 9+
- AWS account with Bedrock access enabled (Nova Lite, Nova Pro, Sonic) and permissions for S3, DynamoDB, and CloudWatch
- Vercel account connected to your GitHub repository

## Quick Start

```bash
# 1. Clone and install dependencies
git clone https://github.com/leoemaxie/noa
cd noa
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your AWS and app settings

# 3. Start the development server
pnpm dev
```

Visit `http://localhost:3000`. The app hot-reloads on file changes.

```bash
# Verify your setup
pnpm test:db                          # Check DynamoDB connectivity
curl http://localhost:3000/api/health  # API health check
```

## Infrastructure Setup

Provision AWS resources with Terraform before deploying:

```bash
cd terraform
terraform init
terraform plan
terraform apply
terraform output > outputs.txt  # Save for environment configuration
```

**Resources created:** S3 buckets (audio + backup), IAM role for Bedrock, CloudWatch log groups.

## API Reference

See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for full endpoint documentation and curl examples.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a doctor or patient account |
| POST | `/api/auth/login` | Authenticate and receive JWT tokens |

### Clinical

| Method | Endpoint | Model | Description |
|---|---|---|---|
| POST | `/api/clinical/soap` | Nova Lite | Generate SOAP note from transcript |
| POST | `/api/clinical/suggestions` | Nova Lite | Real-time clinical recommendations |
| POST | `/api/clinical/insights` | Nova Pro | Advanced analysis and differential diagnosis |
| POST | `/api/clinical/triage` | Nova Lite | Priority triage assessment |

### Sessions & Patients

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/sessions` | Create and list consultation sessions |
| GET/POST | `/api/sessions/voice` | WebSocket-backed voice session management |
| GET | `/api/patients` | List patients for the authenticated doctor |
| GET | `/api/patients/[id]` | Patient details and medical history |

## Deployment

### Production

```bash
# 1. Provision production infrastructure
cd terraform && terraform apply -var="environment=production"

# 2. Push to main — Vercel deploys automatically
git push origin main

# 3. Verify
vercel logs
curl https://your-domain.com/api/health
```

**Pre-deployment checklist:**

- [ ] Terraform apply completed successfully
- [ ] Environment variables set in Vercel dashboard
- [ ] DynamoDB backups enabled
- [ ] S3 encryption enabled
- [ ] IAM roles scoped to least privilege
- [ ] CloudWatch monitoring active

See [deployment.md](docs/deployment.md) for the full production runbook.

## Security

- **Encryption** — TLS 1.3 in transit; S3 and DynamoDB encrypted at rest
- **Access Control** — IAM-based RBAC with OIDC authentication
- **Compliance** — HIPAA-ready with CloudWatch audit logging and data retention policies
- **Hardening** — No hardcoded credentials, parameterized queries, input validation, API rate limiting

## Monitoring

CloudWatch captures application logs, API performance metrics, and errors. Use the built-in health checks:

```bash
curl http://localhost:3000/api/health  # API status
pnpm test:db                           # Database connectivity
pnpm test:aws                          # AWS credential validation
```

## Troubleshooting

**DynamoDB connection error**
```bash
echo $DYNAMODB_TABLE_NAME && echo $AWS_REGION
pnpm test:db
```

**Bedrock access denied**
```bash
aws iam get-role --role-name NoaBedrockRole
aws bedrock list-foundation-models
```

**S3 upload failures**
```bash
aws s3 ls s3://your-bucket-name
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/your-role \
  --action-names s3:PutObject
```

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: your feature"`
4. Push and open a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

MIT — see [LICENSE](./LICENSE) for details.
