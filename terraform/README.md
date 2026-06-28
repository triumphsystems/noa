# Noa Infrastructure as Code (Terraform)

This directory contains Terraform configurations to provision AWS infrastructure for the Noa medical platform. **Note: DynamoDB is managed by Vercel and not provisioned here.**

## Overview

This Terraform configuration provisions:

- **S3 Buckets**: Audio storage and backup buckets with encryption and versioning
- **IAM Roles**: Bedrock and S3 access roles with minimal permissions
- **CloudWatch**: Log groups and monitoring (optional)
- **SNS Topics**: Alert notifications (optional)
- **Security**: Encryption, versioning, lifecycle policies, public access blocking

## Architecture

```
AWS Account (Separate)
├── S3 Buckets (Audio + Backup)
├── IAM Roles
│   ├── Bedrock Role
│   └── S3 Role
├── CloudWatch Logs
└── SNS Topics (optional)

↓ 

Vercel Project (DynamoDB managed separately)
└── Application uses resources from above
```

## Prerequisites

### Local Machine

- Terraform >= 1.0
- AWS CLI v2
- Git
- AWS credentials configured

### AWS Account

- AWS account with administrative access
- Bedrock service access enabled
- IAM permissions to create roles, S3, and CloudWatch

### Vercel

- Vercel project with DynamoDB integration
- GitHub repository connected

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Create Variables File

```bash
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required variables:**
```hcl
aws_region     = "us-east-1"
aws_account_id = "123456789012"  # Get from: aws sts get-caller-identity
environment    = "prod"
app_url        = "https://your-domain.com"
```

### 3. Plan Infrastructure

```bash
terraform plan -out=tfplan
```

Review the output to ensure all resources are correct.

### 4. Apply Configuration

```bash
terraform apply tfplan
```

This creates all AWS resources.

### 5. Export Outputs

```bash
terraform output -json > outputs.json
```

Use these values to configure Vercel environment variables.

## Configuration Files

| File | Purpose |
|------|---------|
| `provider.tf` | AWS provider configuration |
| `variables.tf` | Input variable definitions |
| `main.tf` | Main resource definitions |
| `outputs.tf` | Output definitions |
| `terraform.tfvars.example` | Example variables file |

## Resource Breakdown

### S3 Audio Bucket

Stores consultation recordings and documents.

```hcl
resource "aws_s3_bucket" "audio_bucket"
```

**Features:**
- AES256 encryption
- Versioning enabled
- Public access blocked
- Lifecycle policies (archive to Glacier after 90 days)
- Automatic expiration after 1 year

### S3 Backup Bucket (Optional)

For cross-region replication and disaster recovery.

```hcl
resource "aws_s3_bucket" "backup_bucket"
```

**Enable with:**
```hcl
enable_s3_replication = true
s3_replication_region = "us-west-2"
```

### Bedrock IAM Role

Allows application to invoke Bedrock models.

```hcl
resource "aws_iam_role" "bedrock_role"
```

**Permissions:**
- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels`

### S3 IAM Role

Allows application to read/write S3 objects.

```hcl
resource "aws_iam_role" "s3_role"
```

**Permissions:**
- `s3:GetObject`
- `s3:PutObject`
- `s3:DeleteObject`
- `s3:ListBucket`

### CloudWatch Logs (Optional)

For application logging and monitoring.

```hcl
resource "aws_cloudwatch_log_group" "noa_logs"
```

**Enable with:**
```hcl
enable_monitoring = true
log_retention_days = 30
```

## Variables Reference

### Required Variables

| Variable | Type | Description |
|----------|------|-------------|
| `aws_account_id` | string | AWS Account ID |
| `app_url` | string | Application URL |

### Optional Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `aws_region` | string | us-east-1 | AWS region |
| `project_name` | string | noa | Project name |
| `environment` | string | prod | Environment name |
| `enable_bedrock` | bool | true | Enable Bedrock |
| `enable_monitoring` | bool | true | Enable monitoring |
| `enable_s3_replication` | bool | false | Enable S3 replication |
| `log_retention_days` | number | 30 | Log retention days |

## Environment Variables for Vercel

After running `terraform apply`, add these to your Vercel project:

```bash
# Copy from terraform output
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/noa-bedrock-role-prod
S3_BUCKET=noa-audio-prod-123456789012
S3_BACKUP_BUCKET=noa-backup-prod-123456789012
CLOUDWATCH_LOG_GROUP=/aws/noa/prod
```

**To get outputs:**
```bash
terraform output

# Or in JSON format
terraform output -json
```

## Management Commands

### View Current State

```bash
# List all resources
terraform state list

# Show specific resource
terraform state show aws_s3_bucket.audio_bucket

# Show current outputs
terraform output
```

### Plan Changes

```bash
# Show what will change
terraform plan

# Save plan to file
terraform plan -out=tfplan

# Show detailed plan
terraform plan -json | jq .
```

### Apply Changes

```bash
# Apply with auto-approve (use carefully!)
terraform apply -auto-approve

# Apply specific resource
terraform apply -target=aws_s3_bucket.audio_bucket
```

### Destroy Resources

```bash
# Show what will be destroyed
terraform plan -destroy

# Destroy all resources
terraform destroy

# Destroy specific resource
terraform destroy -target=aws_s3_bucket.audio_bucket
```

### Refresh State

```bash
# Update state from AWS
terraform refresh

# Show state file
terraform state show
```

## State Management

### Local State (Development)

State stored in `terraform.tfstate` (included in `.gitignore`).

### Remote State (Production)

For team collaboration, use S3 backend:

1. Create S3 bucket for state
2. Uncomment backend configuration in `provider.tf`
3. Run `terraform init`

Example backend configuration:

```hcl
backend "s3" {
  bucket         = "noa-terraform-state"
  key            = "prod/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-locks"
}
```

### State Locking

Prevent concurrent modifications using DynamoDB:

```bash
# Create lock table
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

## Debugging

### Verbose Output

```bash
TF_LOG=DEBUG terraform apply
```

### Validate Configuration

```bash
# Check syntax
terraform validate

# Format check
terraform fmt -check

# Format files
terraform fmt -recursive
```

### Show Current Infrastructure

```bash
# ASCII graph
terraform graph | dot -Tsvg > graph.svg

# State details
terraform state show
```

## Troubleshooting

### Error: Access Denied

**Problem:** IAM role lacks permissions

**Solution:**
```bash
# Check credentials
aws sts get-caller-identity

# Verify IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:user/USERNAME \
  --action-names s3:CreateBucket \
  --resource-arns "*"
```

### Error: Bedrock Service Not Available

**Problem:** Bedrock not enabled in region

**Solution:**
```bash
# Check Bedrock availability
aws bedrock list-foundation-models --region us-east-1

# Enable if needed
aws bedrock enable-foundation-model --model-identifier amazon.nova-lite-v1:0
```

### Error: Resource Already Exists

**Problem:** S3 bucket name already taken

**Solution:**
```bash
# Change bucket name in variables
terraform plan -var="project_name=noa-v2"

# Or destroy and recreate
terraform destroy -target=aws_s3_bucket.audio_bucket
```

### State File Corruption

**Problem:** Corrupted terraform.tfstate file

**Solution:**
```bash
# Backup current state
cp terraform.tfstate terraform.tfstate.backup

# Refresh from AWS
terraform refresh

# Validate state
terraform validate
```

## Best Practices

### 1. Use Remote State

```hcl
# Enable for production
backend "s3" {
  encrypt = true
}
```

### 2. Tag All Resources

```hcl
tags = {
  Project     = var.project_name
  Environment = var.environment
  ManagedBy   = "Terraform"
}
```

### 3. Version Control

```bash
# Commit configuration
git add terraform/

# Exclude state files
echo "terraform.tfstate*" >> .gitignore
git add .gitignore
git commit -m "Add Terraform infrastructure"
```

### 4. Use Workspaces for Environments

```bash
# Create workspace
terraform workspace new staging

# Switch workspace
terraform workspace select staging

# Apply for staging
terraform apply -var="environment=staging"
```

### 5. Regular Backups

```bash
# Backup state file
cp terraform.tfstate backups/tfstate-$(date +%Y%m%d).backup

# Or use remote state backups
aws s3 ls s3://noa-terraform-state/
```

## Cost Estimation

Before applying, estimate costs:

```bash
# View resource plan with pricing info
terraform plan

# Use terraform cloud for cost estimates
terraform cloud
```

**Estimated Monthly Costs:**
- S3 Storage: ~$0.50/GB
- S3 Requests: ~$5-50
- CloudWatch Logs: ~$0.50/GB ingested
- NAT Gateway: ~$32 (if used)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Terraform

on:
  pull_request:
    paths:
      - 'terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      
      - name: Terraform Plan
        run: |
          cd terraform
          terraform init
          terraform plan
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Support & Documentation

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

## Next Steps

1. Configure AWS credentials
2. Customize `terraform.tfvars`
3. Run `terraform plan`
4. Review and run `terraform apply`
5. Configure Vercel environment variables
6. Deploy application

## Questions?

See main [README.md](../README.md) for application documentation.
