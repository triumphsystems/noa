# Terraform Execution Guide

Complete step-by-step guide to provision AWS infrastructure for Noa using Terraform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Planning](#planning)
5. [Deployment](#deployment)
6. [Verification](#verification)
7. [Cleanup](#cleanup)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### 1. Install Required Tools

```bash
# macOS with Homebrew
brew install terraform aws-cli

# Ubuntu/Debian
sudo apt-get install terraform awscli

# Windows with Chocolatey
choco install terraform awscli

# Verify installations
terraform --version
aws --version
```

### 2. AWS Account Setup

```bash
# Get AWS Account ID
aws sts get-caller-identity
# Output: { "UserId": "...", "Account": "123456789012", "Arn": "..." }

# Verify Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Check S3 permissions
aws s3 ls

# Check IAM permissions
aws iam list-roles --max-items 5
```

### 3. Configure AWS Credentials

**Option A: AWS CLI Configuration**

```bash
aws configure
# Enter: AWS Access Key ID
# Enter: AWS Secret Access Key
# Enter: Default region (us-east-1)
# Enter: Default output format (json)
```

**Option B: Environment Variables**

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

**Option C: AWS Credentials File**

```bash
# ~/.aws/credentials
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY

# ~/.aws/config
[default]
region = us-east-1
output = json
```

### 4. Verify AWS Access

```bash
# Test AWS credentials
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDACKCEVSQ6C2EXAMPLE",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/username"
# }
```

## Initial Setup

### 1. Navigate to Terraform Directory

```bash
cd /path/to/noa/terraform
ls -la
# Should see: main.tf, variables.tf, outputs.tf, provider.tf
```

### 2. Initialize Terraform

```bash
terraform init

# Output should show:
# Initializing the backend...
# Initializing provider plugins...
# Terraform has been successfully initialized!
```

**Troubleshooting `init` failures:**

```bash
# Clear cached providers
rm -rf .terraform

# Reinitialize
terraform init -upgrade

# Check plugin compatibility
terraform version
```

### 3. Validate Configuration

```bash
terraform validate

# Expected output:
# Success! The configuration is valid.
```

## Configuration

### 1. Create Variables File

```bash
# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
# or
vim terraform.tfvars
# or
code terraform.tfvars  # VS Code
```

### 2. Set Required Variables

Open `terraform.tfvars` and configure:

```hcl
# Get account ID from: aws sts get-caller-identity
aws_account_id = "123456789012"

# Your AWS region
aws_region = "us-east-1"

# Project identifier
project_name = "noa"

# Environment
environment = "prod"  # or "staging", "dev"

# Your application URL (for future use)
app_url = "https://noa.yourdomain.com"
```

### 3. Customize Optional Settings

```hcl
# Enable/disable features
enable_bedrock         = true
enable_monitoring      = true
enable_s3_replication  = false  # Set to true for disaster recovery

# If enabling S3 replication
s3_replication_region  = "us-west-2"

# CloudWatch log retention
log_retention_days     = 30  # 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653

# Tags for resource tracking
tags = {
  Component   = "NoaMedicalPlatform"
  CostCenter  = "Engineering"
  Owner       = "your-name"
  Team        = "Platform"
}
```

### 4. Validate Configuration

```bash
# Check syntax
terraform validate
# Success! The configuration is valid.

# Format configuration
terraform fmt -recursive
# Checks all Terraform files

# Check for issues
terraform plan -input=false 2>&1 | head -20
```

## Planning

### 1. Generate Execution Plan

```bash
# Basic plan
terraform plan

# Save plan to file (recommended for production)
terraform plan -out=tfplan

# Show plan in JSON format
terraform plan -json > tfplan.json

# Show detailed changes
terraform plan -detailed-exitcode
```

### 2. Review Plan Output

Look for these sections:

```
Plan: X to add, Y to change, Z to destroy

# Resources being created (marked with +)
# - aws_s3_bucket.audio_bucket (will be created)
# - aws_iam_role.bedrock_role (will be created)

# Resources being modified (marked with ~)
# Resources being destroyed (marked with -)
```

### 3. Verify Resources

Check the plan includes:

- [ ] S3 audio bucket
- [ ] IAM Bedrock role
- [ ] IAM S3 role
- [ ] CloudWatch log group (if monitoring enabled)
- [ ] SNS topic (if monitoring enabled)

### 4. Address Warnings

```bash
# Check for warnings
terraform plan | grep -i warning

# Common warnings are usually safe:
# "Resource arguments changed" - benign if you're updating config
# "Argument is deprecated" - safe if not used
```

## Deployment

### 1. Pre-Deployment Checklist

```bash
# Verify AWS access
aws sts get-caller-identity

# Check Bedrock models
aws bedrock list-foundation-models --region us-east-1 | grep nova

# Verify S3 access
aws s3 ls

# Confirm terraform plan
terraform plan -input=false | grep "Plan:"
```

### 2. Apply Configuration

**Development/Staging (safe):**

```bash
# Apply with confirmation
terraform apply

# Type "yes" when prompted
```

**Production (saved plan):**

```bash
# Apply saved plan (no confirmation needed)
terraform apply tfplan

# Monitor progress
# Terraform will create resources one by one
```

### 3. Monitor Deployment Progress

```bash
# Watch for this output:
# aws_s3_bucket.audio_bucket: Creating...
# aws_s3_bucket.audio_bucket: Creation complete
# aws_iam_role.bedrock_role: Creating...
# ... [continues] ...
# Apply complete! Resources: 5 added, 0 changed, 0 destroyed.
```

### 4. Save Outputs

```bash
# Display all outputs
terraform output

# Export to JSON
terraform output -json > outputs.json

# Export specific output
terraform output s3_bucket_name
terraform output bedrock_role_arn

# Pretty print
terraform output -json | jq .
```

**Sample outputs:**
```json
{
  "s3_bucket_name": "noa-audio-prod-123456789012",
  "bedrock_role_arn": "arn:aws:iam::123456789012:role/noa-bedrock-role-prod",
  "s3_role_arn": "arn:aws:iam::123456789012:role/noa-s3-role-prod",
  "cloudwatch_log_group": "/aws/noa/prod"
}
```

## Verification

### 1. Verify S3 Buckets

```bash
# List buckets
aws s3 ls

# Check bucket configuration
aws s3api get-bucket-versioning --bucket noa-audio-prod-123456789012
aws s3api get-bucket-encryption --bucket noa-audio-prod-123456789012
aws s3api list-bucket-lifecycle-configuration --bucket noa-audio-prod-123456789012

# Test upload
echo "test" > test.txt
aws s3 cp test.txt s3://noa-audio-prod-123456789012/test.txt
rm test.txt

# Cleanup
aws s3 rm s3://noa-audio-prod-123456789012/test.txt
```

### 2. Verify IAM Roles

```bash
# Check Bedrock role
aws iam get-role --role-name noa-bedrock-role-prod

# Check role trust relationship
aws iam get-role-policy --role-name noa-bedrock-role-prod --policy-name noa-bedrock-policy

# Check S3 role
aws iam get-role --role-name noa-s3-role-prod
aws iam get-role-policy --role-name noa-s3-role-prod --policy-name noa-s3-policy
```

### 3. Verify Bedrock Access

```bash
# List available models
aws bedrock list-foundation-models --region us-east-1

# Test model invocation (optional)
aws bedrock-runtime invoke-model \
  --model-id us.anthropic.claude-3-5-sonnet-20241022 \
  --body '{"prompt":"Hello"}' \
  response.json
```

### 4. Check CloudWatch Logs

```bash
# List log groups
aws logs describe-log-groups

# Check if Noa log group exists
aws logs describe-log-groups --log-group-name-prefix "/aws/noa"
```

### 5. Terraform State Check

```bash
# List all resources in state
terraform state list

# Show specific resource details
terraform state show aws_s3_bucket.audio_bucket

# Validate state integrity
terraform validate
```

## Post-Deployment

### 1. Configure Vercel Environment Variables

Copy the outputs to your Vercel project:

```bash
# Get all values
terraform output -json

# Add to Vercel (Settings → Environment Variables)
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/noa-bedrock-role-prod
S3_BUCKET=noa-audio-prod-123456789012
S3_BACKUP_BUCKET=noa-backup-prod-123456789012
CLOUDWATCH_LOG_GROUP=/aws/noa/prod
```

### 2. Test Application Connectivity

```bash
# In your application directory
pnpm dev

# Check database connection
curl http://localhost:3000/api/health

# Test Bedrock access
curl http://localhost:3000/api/clinical/soap \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Patient reports fever"}'

# Test S3 access
curl http://localhost:3000/api/sessions \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"patientId":"p1","doctorId":"d1","transcript":"Test"}'
```

### 3. Deploy Application

```bash
# Push to GitHub
git add terraform/
git commit -m "Add Terraform infrastructure"
git push origin main

# Vercel automatically deploys
# Check deployment at: vercel.com/dashboard
```

## Cleanup

### 1. Remove Infrastructure (If Needed)

```bash
# Show what will be destroyed
terraform plan -destroy

# Destroy all resources
terraform destroy

# Type "yes" to confirm
```

### 2. Verify Deletion

```bash
# Check S3 buckets
aws s3 ls

# Check IAM roles
aws iam list-roles --max-items 10

# Check CloudWatch
aws logs describe-log-groups
```

### 3. Clean Local Files

```bash
# Remove state files (if using local state)
rm terraform.tfstate*
rm terraform.tfvars  # Don't commit credentials!

# Remove plan files
rm tfplan
rm tfplan.json

# Clean Terraform directory
rm -rf .terraform/
```

## Troubleshooting

### Common Errors

**Error: "AccessDenied: User is not authorized"**

```bash
# Verify credentials
aws sts get-caller-identity

# Check IAM permissions
aws iam get-user

# Solution: Use credentials with appropriate permissions
```

**Error: "S3 bucket name already in use"**

```bash
# Bucket names must be globally unique
# Solution: Change project_name in terraform.tfvars
terraform apply -var="project_name=noa-v2"

# Or destroy and recreate with different name
terraform destroy -target=aws_s3_bucket.audio_bucket
```

**Error: "Bedrock: User is not authorized"**

```bash
# Check Bedrock enablement
aws bedrock list-foundation-models --region us-east-1

# If error, enable Bedrock
aws bedrock enable-foundation-model \
  --model-identifier amazon.nova-lite-v1:0

# Verify role has Bedrock permissions
aws iam get-role-policy \
  --role-name noa-bedrock-role-prod \
  --policy-name noa-bedrock-policy
```

**Error: "Terraform state locked"**

```bash
# If using remote state with locks
# Check for stuck locks
terraform force-unlock <LOCK_ID>

# Or clean up locks
rm terraform.tfstate.*.backup
```

### Debug Mode

```bash
# Enable verbose logging
export TF_LOG=DEBUG
terraform plan

# Show all operations
export TF_LOG_PATH=terraform.log
terraform apply

# View logs
tail -f terraform.log
```

## Getting Help

### Documentation

- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/latest
- AWS S3: https://docs.aws.amazon.com/s3/
- AWS IAM: https://docs.aws.amazon.com/iam/
- AWS Bedrock: https://docs.aws.amazon.com/bedrock/

### Commands Reference

```bash
# Initialize
terraform init

# Validate syntax
terraform validate

# Format code
terraform fmt

# Plan changes
terraform plan

# Apply changes
terraform apply

# Destroy resources
terraform destroy

# View outputs
terraform output

# Refresh state
terraform refresh

# Import existing resource
terraform import aws_s3_bucket.audio_bucket noa-audio-prod-123456789012
```

## Success Checklist

- [ ] Terraform initialized successfully
- [ ] AWS credentials configured
- [ ] `terraform plan` shows expected resources
- [ ] `terraform apply` completes without errors
- [ ] S3 buckets created and accessible
- [ ] IAM roles created with correct permissions
- [ ] Outputs exported for Vercel configuration
- [ ] Vercel environment variables updated
- [ ] Application successfully connects to resources
- [ ] Application deployed to production

## Next Steps

1. ✅ Provision AWS resources (this guide)
2. Configure Vercel environment variables
3. Deploy application to Vercel
4. Test all functionality
5. Set up monitoring and alerting
6. Plan backup strategy

**You're all set! Your infrastructure is ready for the Noa application.**
