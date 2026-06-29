# Infrastructure Configuration Guide

Complete guide to configure the Noa application to use Terraform-provisioned AWS resources, including DynamoDB.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Deployment                       │
├─────────────────────────────────────────────────────────────┤
│  Next.js Application                                        │
│  - Docker Container                                         │
│  - Environment Variables                                    │
│  - Vercel KV/Redis (optional)                               │
└─────────────┬───────────────────────────────────────────────┘
              │
    ┌─────────┼──────────────────────┐
    │         │                      │
    │    ┌────▼────┐          ┌─────▼──┐
    │    │AWS      │          │AWS     │
    │    │DynamoDB │          │Account │
    │    │(Tf)     │          │(via    │
    │    │         │          │IAM)    │
    │    └─────────┘          └────┬───┘
    │                             │
    │        ┌────────────────────┼────────────────────┐
    │        │                    │                    │
    │    ┌───▼──┐           ┌────▼───┐         ┌────▼──┐
    │    │S3    │           │Bedrock │         │Cloud  │
    │    │Audio │           │Nova    │         │Watch  │
    │    │      │           │Sonic   │         │Logs   │
    │    └──────┘           └────────┘         └───────┘
    │
    └─ Uses OIDC for IAM Authentication
```

## Step-by-Step Configuration

### 1. AWS Infrastructure (Terraform)

#### A. Prerequisites
```bash
# Verify AWS account access
aws sts get-caller-identity
# Output: { "Account": "123456789012", ... }

# Verify Bedrock access
aws bedrock list-foundation-models --region us-east-1
```

#### B. Deploy Infrastructure
```bash
cd terraform

# Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your AWS account ID

# Initialize and apply
terraform init
terraform plan
terraform apply

# Save outputs
terraform output -json > ../terraform-outputs.json
```

#### C. Verify Resources
```bash
# Check S3 buckets
aws s3 ls | grep noa-audio

# Check IAM roles
aws iam list-roles | grep noa-bedrock

# Check CloudWatch
aws logs describe-log-groups --log-group-name-prefix "/aws/noa"
```

### 2. Environment Variables

#### A. Local Development (.env.local)

```bash
# Copy template
cp .env.example .env.local

# Fill in from Terraform outputs
cat terraform-outputs.json | jq '.environment_variables.value'

# Edit .env.local with:
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
DYNAMODB_TABLE_NAME=noa-data
DYNAMODB_TABLE_PARTITION_KEY=id
S3_BUCKET=noa-audio-prod-123456789012
S3_BACKUP_BUCKET=noa-backup-prod-123456789012
```

#### B. Vercel Production

```bash
# Method 1: Using Vercel CLI
vercel env add AWS_REGION
vercel env add AWS_ACCOUNT_ID
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add S3_BUCKET
vercel env add DYNAMODB_TABLE_NAME

# Method 2: Vercel Dashboard
# 1. Go to vercel.com/dashboard
# 2. Select project
# 3. Settings → Environment Variables
# 4. Add each variable for Production environment
```

#### C. Required Variables for Terraform-Provisioned Resources

| Variable | Source | Example |
|----------|--------|---------|
| `AWS_REGION` | Your choice | us-east-1 |
| `AWS_ACCOUNT_ID` | Terraform/AWS Account | 123456789012 |
| `AWS_ACCESS_KEY_ID` | Runtime credential | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Runtime credential | `...` |
| `S3_BUCKET` | Terraform output | noa-audio-prod-123456789012 |
| `S3_BACKUP_BUCKET` | Terraform output | noa-backup-prod-123456789012 |
| `CLOUDWATCH_LOG_GROUP` | Terraform output | /aws/noa/prod |

#### D. Terraform-Provisioned DynamoDB

DynamoDB is provisioned in Terraform as a pay-per-request table to keep idle cost as close to zero as possible.

**Terraform outputs:**
- `dynamodb_table_name` - the application table name
- `dynamodb_table_arn` - ARN for IAM policy wiring
- `environment_variables.DYNAMODB_TABLE_NAME` - safe to copy into Vercel

**Verify in AWS:**
1. Run `terraform output dynamodb_table_name`
2. Describe the table in AWS CLI
3. Confirm the three indexes exist: `email-index`, `doctorId-index`, `patientId-index`

### 3. Code Configuration

The application reads configuration from `lib/aws-config.ts`:

```typescript
// Automatically loaded from environment
const awsConfig = {
  region: process.env.AWS_REGION,
  s3: {
    bucket: process.env.S3_BUCKET,  // Terraform-provisioned
  },
  bedrock: {
    models: {
      novaLite: process.env.BEDROCK_NOVA_LITE_MODEL,
    },
  },
}
```

#### A. Code Already Configured

These files automatically use the infrastructure:

- `lib/db.ts` - DynamoDB operations via AWS SDK and standard AWS credentials
- `lib/bedrock-nova.ts` - Bedrock Nova models
- `lib/voice-service.ts` - Audio processing via Sonic
- `app/api/sessions/route.ts` - Uses S3 and DynamoDB

#### B. Adding New Resources

If you add new resources via Terraform:

1. Update terraform variables
2. Export from terraform outputs
3. Add to `.env.example`
4. Add to Vercel environment variables
5. Update `lib/aws-config.ts` to reference new variables

### 4. Local Development Setup

#### A. Configure Local AWS Credentials

```bash
# Option 1: AWS CLI
aws configure
# Enter: Access Key ID
# Enter: Secret Access Key
# Enter: Region: us-east-1

# Option 2: Environment variables
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_DEFAULT_REGION="us-east-1"

# Option 3: AWS credentials file
cat ~/.aws/credentials
# [default]
# aws_access_key_id = YOUR_KEY
# aws_secret_access_key = YOUR_SECRET
```

#### B. Create .env.local

```bash
# Copy and customize
cp .env.example .env.local

# Add all Terraform outputs
nano .env.local
```

**Minimum for local testing:**
```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
DYNAMODB_TABLE_NAME=noa-data
DYNAMODB_TABLE_PARTITION_KEY=id
S3_BUCKET=noa-audio-prod-123456789012
NODE_ENV=development
```

#### C. Start Development Server

```bash
pnpm dev

# Should see:
# ✓ Ready in 3.2s
# ○ Listening on http://localhost:3000
```

#### D. Test Infrastructure Connectivity

```bash
# Test DynamoDB
curl http://localhost:3000/api/patients?doctorId=test

# Test S3
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"doctorId":"d1","patientId":"p1"}'

# Test Bedrock
curl -X POST http://localhost:3000/api/clinical/soap \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Patient reports fever","sessionId":"s1"}'
```

### 5. Vercel Deployment Configuration

#### A. Connect GitHub Repository

```bash
# Push code to GitHub
git add .
git commit -m "Configure Terraform infrastructure"
git push origin main

# Connect to Vercel in dashboard
# 1. vercel.com/dashboard
# 2. Import project
# 3. Select GitHub repository
# 4. Configure build settings
```

#### B. Add Environment Variables to Vercel

**Via Vercel Dashboard:**
1. Go to project Settings
2. Select Environment Variables
3. Add variables (development, preview, production)
4. Select which environments to enable for each

**Via Vercel CLI:**
```bash
# Add variable
vercel env add AWS_REGION

# Remove variable
vercel env remove AWS_REGION

# List all variables
vercel env ls
```

**Environment-Specific Variables:**
```bash
# Development
vercel env add AWS_REGION --environment development

# Preview (staging)
vercel env add AWS_REGION --environment preview

# Production
vercel env add AWS_REGION --environment production
```

#### C. Deploy

```bash
# Deploy current branch
vercel

# Deploy production
git push origin main

# Vercel automatically deploys

# View deployment
vercel logs

# Monitor
vercel inspect
```

### 6. DynamoDB Setup

#### A. Verify Terraform Output

1. Run `terraform output dynamodb_table_name`
2. Confirm the table exists in AWS
3. Confirm the three indexes exist

#### B. Verify Setup

```bash
# Check environment variables
echo $DYNAMODB_TABLE_NAME
echo $AWS_ACCESS_KEY_ID
```

#### C. Test Connection

```bash
# After deployment, test DynamoDB
curl https://your-deployment.vercel.app/api/health

# Should connect successfully
```

### 7. Verify All Infrastructure

#### A. Application Connectivity Test

```bash
# Local development
pnpm dev

# In another terminal
curl http://localhost:3000/api/health

# Expected: { "status": "ok" }
```

#### B. AWS Resource Verification

```bash
# S3 bucket accessible
aws s3 ls s3://noa-audio-prod-123456789012

# IAM role valid
aws iam get-role --role-name noa-bedrock-role-prod

# Bedrock models available
aws bedrock list-foundation-models --region us-east-1

# DynamoDB table exists
aws dynamodb describe-table --table-name noa-data --region us-east-1
```

#### C. Bedrock Model Access

```bash
# Test model invocation
aws bedrock-runtime invoke-model \
  --model-id us.anthropic.claude-3-5-sonnet-20241022 \
  --body '{"messages":[{"role":"user","content":"Hello"}]}' \
  response.json

cat response.json
```

### 8. Security Verification

#### A. Check IAM Permissions

```bash
# Verify Bedrock policy
aws iam get-role-policy \
  --role-name noa-bedrock-role-prod \
  --policy-name noa-bedrock-policy

# Verify S3 policy
aws iam get-role-policy \
  --role-name noa-s3-role-prod \
  --policy-name noa-s3-policy
```

#### B. Check S3 Security

```bash
# Verify encryption
aws s3api get-bucket-encryption --bucket noa-audio-prod-123456789012

# Verify versioning
aws s3api get-bucket-versioning --bucket noa-audio-prod-123456789012

# Verify public access block
aws s3api get-public-access-block --bucket noa-audio-prod-123456789012
```

#### C. Check DynamoDB Security

```bash
# Verify encryption
aws dynamodb describe-table \
  --table-name noa-data \
  --region us-east-1 | grep SSE
```

### 9. Troubleshooting Configuration

#### Issue: "Access Denied" Errors

**Check 1: AWS Credentials**
```bash
aws sts get-caller-identity
# Should return your account ID
```

**Check 2: IAM Permissions**
```bash
aws sts get-caller-identity
```

**Check 3: Environment Variables**
```bash
# In your app directory
echo $AWS_ACCESS_KEY_ID
echo $S3_BUCKET
```

#### Issue: "DynamoDB Table Not Found"

```bash
# Verify table exists
aws dynamodb list-tables

# Verify Vercel integration
vercel env list | grep DYNAMODB

# Check table in Vercel dashboard
```

#### Issue: "Bedrock Model Not Available"

```bash
# Check model availability
aws bedrock list-foundation-models \
  --region $AWS_REGION | grep nova

# Enable model if needed
aws bedrock enable-foundation-model \
  --model-identifier amazon.nova-lite-v1:0
```

### 10. Configuration Checklist

- [ ] Terraform infrastructure deployed
- [ ] AWS resources created (S3, IAM, CloudWatch)
- [ ] Environment variables collected from Terraform
- [ ] `.env.local` configured with variables
- [ ] Local AWS credentials configured
- [ ] Application starts without errors (`pnpm dev`)
- [ ] Local API tests pass (curl health check)
- [ ] Vercel project created
- [ ] GitHub repository connected
- [ ] Vercel environment variables added
- [ ] DynamoDB table verified
- [ ] Application deployed to Vercel
- [ ] Production API tests pass
- [ ] Monitoring and logging verified
- [ ] Backup strategy confirmed

## Environment Variable Quick Reference

### Terraform-Provisioned (External AWS Account)
- `AWS_REGION` - Region where resources deployed
- `AWS_ACCOUNT_ID` - AWS Account ID
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - AWS runtime credentials
- `S3_BUCKET` - Audio storage bucket
- `S3_BACKUP_BUCKET` - Backup bucket
- `CLOUDWATCH_LOG_GROUP` - Logs location

### Terraform-Provisioned (DynamoDB)
- `DYNAMODB_TABLE_NAME` - Set from Terraform outputs
- `DYNAMODB_TABLE_PARTITION_KEY` - `id`

### Application-Specific
- `NODE_ENV` - development/production
- `NEXT_PUBLIC_APP_URL` - Application URL
- `LOG_LEVEL` - Logging verbosity
- Various feature flags

## Next Steps

1. ✅ Deploy Terraform infrastructure
2. ✅ Configure environment variables
3. ✅ Test local connectivity
4. ✅ Deploy to Vercel
5. Monitor and maintain

**Your infrastructure is now fully configured and ready for production!**
