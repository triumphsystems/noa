# Noa - AI-Powered Medical Intelligence Platform

A production-ready healthcare application that transforms medical consultations into structured clinical intelligence using AWS Bedrock (Nova & Sonic), real-time voice processing, and AI-powered SOAP note generation.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Infrastructure Setup](#infrastructure-setup)
- [Environment Configuration](#environment-configuration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Support](#support)

## Features

### Core Medical Platform
- **Doctor Dashboard**: Real-time session management, patient directory, clinical summaries
- **Voice-First Consultation**: Live audio recording with automatic transcription
- **AI Clinical Intelligence**: Real-time suggestions powered by Nova AI models
- **SOAP Note Generation**: Automatic generation from consultation transcripts using Nova Lite
- **Patient Management**: Complete patient profiles, medical history, and outcomes
- **Patient Intake Forms**: Multi-step intake collection for comprehensive patient data
- **Session History**: Complete consultation records with timestamps and clinical notes

### AI-Powered Features
- **Nova Lite**: SOAP note generation, patient summaries, follow-up planning
- **Nova Pro**: Advanced clinical analysis, pattern recognition, differential diagnosis
- **Sonic**: Real-time voice processing, transcription, sentiment analysis
- **Clinical Suggestions**: Real-time AI-generated clinical recommendations during consultations

### Technical Features
- Real-time WebSocket communication for multi-participant sessions
- Secure audio streaming and storage in S3
- DynamoDB for high-performance data persistence
- HIPAA-ready architecture with encryption and audit logging
- Role-based access control (Doctor/Patient)
- Production-grade error handling and monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel/Next.js Frontend                  │
│  (Doctor Dashboard, Patient Portals, Real-time UI)          │
└─────────────┬───────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────────┐
│              Next.js API Routes & WebSocket                 │
│  (Authentication, Session Management, Clinical Processing)  │
└─────────────┬───────────────────────────────────────────────┘
              │
    ┌─────────┼─────────┬──────────┬─────────────┐
    │         │         │          │             │
┌───▼──┐  ┌──▼──┐  ┌───▼──┐  ┌───▼────┐  ┌────▼───┐
│AWS   │  │AWS  │  │AWS   │  │AWS     │  │Vercel  │
│S3    │  │Bed- │  │IAM   │  │CloudW- │  │DynamoDB│
│Audio │  │rock │  │Auth  │  │atch    │  │(Managed)
│Store │  │Nova │  │      │  │Logs    │  │        │
└──────┘  └─────┘  └──────┘  └────────┘  └────────┘
```

## Tech Stack

### Frontend & Backend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Ditto design system
- **UI Components**: shadcn/ui

### Database & Storage
- **Database**: AWS DynamoDB (Vercel-managed)
- **File Storage**: AWS S3 (Terraform-provisioned)
- **Audio Processing**: AWS Bedrock Sonic

### AI & ML
- **LLM Models**: AWS Bedrock (Nova Lite, Nova Pro)
- **Voice Processing**: AWS Bedrock Sonic
- **Clinical Intelligence**: Custom prompts for healthcare

### Infrastructure & DevOps
- **Hosting**: Vercel
- **IaC**: Terraform
- **Monitoring**: AWS CloudWatch
- **Authentication**: AWS IAM (OIDC)

### Libraries
- **State Management**: Zustand
- **Real-time**: Socket.io
- **Data Fetching**: SWR
- **Audio**: react-mic, wav-encoder

## Prerequisites

### Development
- Node.js 18.x or higher
- pnpm 8.x or higher
- Git

### AWS Account Requirements
- AWS Account with appropriate permissions
- Bedrock access enabled (Nova Lite, Nova Pro, Sonic)
- IAM permissions for S3, Bedrock, CloudWatch

### Vercel Setup
- Vercel account with DynamoDB integration enabled
- GitHub repository connected to Vercel

## Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd noa
pnpm install
```

### 2. Environment Setup

```bash
# Copy example environment file
cp .env.example .env.local

# Fill in your configuration (see Environment Configuration section)
```

### 3. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` - the app auto-reloads as you edit files.

### 4. Verify Setup

```bash
# Check database connectivity
pnpm test:db

# Run health check
curl http://localhost:3000/api/health
```

## Infrastructure Setup

### AWS Resources (Via Terraform)

Before deploying, provision AWS resources:

```bash
# Navigate to infrastructure
cd terraform

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply configuration
terraform apply

# Save outputs for environment configuration
terraform output > outputs.txt
```

**Resources Created:**
- S3 bucket for audio/documents storage
- S3 bucket for backups
- IAM role for Bedrock access
- CloudWatch log groups
- Optional: API Gateway, SNS topics

### Vercel Configuration

1. **Connect DynamoDB Integration**:
   - Go to Vercel Dashboard → Project Settings
   - Add DynamoDB integration
   - Select or create DynamoDB table

2. **Environment Variables**:
   ```
   AWS_REGION=us-east-1
   AWS_ROLE_ARN=arn:aws:iam::ACCOUNT:role/NoaBedrockRole
   DYNAMODB_TABLE_NAME=noa-data
   S3_BUCKET=noa-audio-bucket
   S3_BACKUP_BUCKET=noa-backup-bucket
   ```

3. **Deploy**:
   ```bash
   git push  # Automatically deploys to Vercel
   ```

## Environment Configuration

### Required Environment Variables

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::ACCOUNT:role/NoaBedrockRole
AWS_ACCOUNT_ID=123456789012

# Database (Vercel-Managed)
DYNAMODB_TABLE_NAME=noa-data
DYNAMODB_TABLE_PARTITION_KEY=id

# Storage (AWS-Provisioned)
S3_BUCKET=noa-audio-bucket
S3_BACKUP_BUCKET=noa-backup-bucket
S3_REGION=us-east-1

# Bedrock Configuration
BEDROCK_REGION=us-east-1
BEDROCK_NOVA_LITE_MODEL=us.anthropic.claude-3-5-sonnet-20241022
BEDROCK_NOVA_PRO_MODEL=us.anthropic.claude-3-5-sonnet-20241022
BEDROCK_SONIC_MODEL=amazon.nova-lite-v1:0

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
LOG_LEVEL=info
```

### Development Overrides

For local development, you can use `.env.local`:

```env
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=noa-dev
S3_BUCKET=noa-audio-bucket-dev
NODE_ENV=development
```

## API Documentation

### Authentication Endpoints

**POST /api/auth/signup**
- Create doctor or patient account
- Stores in DynamoDB
- Returns user ID and tokens

**POST /api/auth/login**
- Authenticate user
- Queries DynamoDB
- Returns JWT tokens

### Clinical Endpoints

**POST /api/clinical/soap**
- Generate SOAP note from transcript
- Uses Nova Lite model
- Stores in session record

**POST /api/clinical/suggestions**
- Get real-time clinical suggestions
- Uses Nova Lite model
- Called during consultations

**POST /api/clinical/insights**
- Advanced clinical analysis
- Uses Nova Pro model
- Multi-parameter analysis

**POST /api/clinical/triage**
- Triage assessment
- Uses Nova Lite model
- Priority classification

### Session Endpoints

**GET/POST /api/sessions**
- Create and manage consultation sessions
- Stores in DynamoDB
- Supports streaming

**GET/POST /api/sessions/voice**
- Voice session management
- WebSocket support
- Real-time processing

### Patient Endpoints

**GET /api/patients**
- List doctor's patients
- Queries DynamoDB

**GET /api/patients/[id]**
- Get patient details
- Includes medical history

See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for detailed endpoint documentation and curl examples.

## Deployment

### Development Deployment

```bash
# Start dev server
pnpm dev

# Server runs on http://localhost:3000
```

### Production Deployment

#### 1. Configure AWS Resources

```bash
cd terraform
terraform apply -var="environment=production"
```

#### 2. Deploy to Vercel

```bash
# Push to main branch
git push origin main

# Vercel automatically deploys
# Monitor at: https://vercel.com/dashboard
```

#### 3. Verify Deployment

```bash
# Check deployment status
vercel status

# View logs
vercel logs

# Test API
curl https://your-domain.com/api/health
```

### Production Checklist

- [ ] AWS resources provisioned with Terraform
- [ ] Environment variables configured in Vercel
- [ ] DynamoDB backup enabled
- [ ] CloudWatch monitoring active
- [ ] S3 encryption enabled
- [ ] IAM roles properly scoped
- [ ] Error tracking configured
- [ ] Database backups scheduled

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed production deployment procedures.

## Project Structure

```
noa/
├── app/
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── clinical/             # Clinical AI endpoints
│   │   ├── patients/             # Patient management
│   │   └── sessions/             # Session management
│   ├── dashboard/                # Doctor dashboard pages
│   ├── auth/                     # Authentication pages
│   ├── patient-dashboard/        # Patient portals
│   └── layout.tsx
├── lib/
│   ├── db.ts                     # DynamoDB operations
│   ├── bedrock-nova.ts           # Nova model integration
│   ├── voice-service.ts          # Sonic voice processing
│   ├── websocket-service.ts      # Real-time communication
│   ├── stores/                   # Zustand state management
│   └── aws-config.ts             # AWS configuration
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── session/                  # Session-specific components
├── terraform/                    # Infrastructure as Code
│   ├── main.tf                   # Main configuration
│   ├── variables.tf              # Variable definitions
│   ├── outputs.tf                # Output definitions
│   └── modules/                  # Terraform modules
├── docs/                         # Documentation
├── public/                       # Static assets
└── package.json
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/db.ts` | DynamoDB CRUD operations |
| `lib/bedrock-nova.ts` | Nova AI model integration |
| `lib/voice-service.ts` | Sonic voice processing |
| `app/api/clinical/soap/route.ts` | SOAP generation endpoint |
| `app/dashboard/sessions/new/page.tsx` | Voice consultation UI |
| `terraform/main.tf` | AWS resource definitions |

## Documentation

- **[START_HERE.md](./START_HERE.md)** - Documentation navigation
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[AWS_INTEGRATION_GUIDE.md](./AWS_INTEGRATION_GUIDE.md)** - AWS setup
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment
- **[TERRAFORM_GUIDE.md](./terraform/README.md)** - Infrastructure as Code
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - API reference
- **[FEATURES_IMPLEMENTED.md](./FEATURES_IMPLEMENTED.md)** - Feature list

## Performance

### Optimization Strategies

- Real-time SOAP generation: ~2-3 seconds
- Voice transcription: <100ms latency via WebSocket
- Patient queries: <500ms via DynamoDB GSI
- Session streaming: Real-time via Socket.io

### Scalability

- Horizontal scaling via Vercel
- DynamoDB auto-scaling
- S3 unlimited storage
- CloudWatch monitoring and alerting

## Security

### Data Protection

- Encryption in transit (TLS 1.3)
- Encryption at rest (S3, DynamoDB)
- IAM-based access control
- OIDC authentication

### Compliance

- HIPAA-ready architecture
- Audit logging via CloudWatch
- Data retention policies
- Secure session management

### Best Practices

- No hardcoded credentials
- Parameterized database queries
- Input validation and sanitization
- Rate limiting on API endpoints

## Monitoring & Observability

### CloudWatch Integration

- Application logs
- API performance metrics
- Error tracking
- Custom dashboards

### Health Checks

```bash
# API health
curl http://localhost:3000/api/health

# Database connectivity
pnpm test:db

# AWS credentials
pnpm test:aws
```

## Troubleshooting

### Common Issues

**DynamoDB Connection Error**
```bash
# Check environment variables
echo $DYNAMODB_TABLE_NAME
echo $AWS_REGION

# Test connection
pnpm test:db
```

**Bedrock Access Denied**
```bash
# Verify IAM role
aws iam get-role --role-name NoaBedrockRole

# Check Bedrock access
aws bedrock list-foundation-models
```

**S3 Upload Failures**
```bash
# Check S3 bucket exists
aws s3 ls s3://$S3_BUCKET

# Verify IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn $AWS_ROLE_ARN \
  --action-names s3:PutObject
```

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more solutions.

## Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and test locally
pnpm dev

# Run tests
pnpm test

# Commit with conventional commits
git commit -m "feat: your feature"

# Push and create pull request
git push origin feature/your-feature
```

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

MIT - See [LICENSE](./LICENSE) for details.

## Support

### Documentation
- Check [START_HERE.md](./START_HERE.md) for navigation
- Review [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for APIs
- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment

### Issues & Questions
- GitHub Issues for bug reports
- Discussions for questions
- Email: support@noa-health.com

### Community
- Discord: [Join our community](https://discord.gg/noa-health)
- Twitter: [@NoaHealth](https://twitter.com/noa-health)

---

**Built with ❤️ for healthcare professionals**

**Ready to transform medical consultations into clinical intelligence? Start with [START_HERE.md](./START_HERE.md)**
