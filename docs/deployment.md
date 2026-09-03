# Deployment & Infrastructure Runbook

Step-by-step guide for provisioning AWS infrastructure with Terraform, configuring environment variables, deploying to Vercel, and local development.

---

## 1. Prerequisites

- **Node.js**: 20+ and **pnpm**: 9+
- **AWS Account**:
  - Permissions to create DynamoDB tables, S3 buckets, and IAM roles.
  - AWS Bedrock access enabled in your target region (default: `us-east-1`). Ensure foundation model access is requested for Amazon Nova Lite / Claude.
- **AWS CLI v2**: Configured locally (`aws configure`) or via environment credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).
- **Terraform**: v1.0+
- **Vercel Account**: For production hosting.

---

## 2. Provision Infrastructure (Terraform)

All AWS resources (DynamoDB table, S3 buckets, IAM roles) are managed via Terraform in the `terraform/` directory.

### Quick Deploy

```bash
# 1. Navigate to terraform directory
cd terraform

# 2. Initialize provider and modules
terraform init

# 3. Create your variable file
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
aws_region     = "us-east-1"
aws_account_id = "123456789012"         # From: aws sts get-caller-identity
environment    = "production"           # "development" | "staging" | "production"
app_url        = "https://your-domain.com"
```

Apply the plan:
```bash
# 4. Review and provision resources
terraform plan -out=tfplan
terraform apply tfplan

# 5. Export created resource IDs
terraform output
```

### Resources Provisioned

- **DynamoDB**: `noa-data` table (`PAY_PER_REQUEST` billing mode) with GSIs `email-index`, `doctorId-index`, and `patientId-index`.
- **S3 Bucket**: Encrypted audio and report storage bucket with versioning and 90-day Glacier lifecycle policy.
- **IAM Roles**: Least-privilege roles for Bedrock model invocation and S3 read/write operations.
- **CloudWatch** *(optional)*: Application log group with configurable retention.

*For advanced options (such as cross-region S3 replication or CloudWatch alerts), refer to [`terraform/README.md`](../terraform/README.md).*

---

## 3. Environment Variables Reference

Create `.env.local` for local development or input these into your Vercel Project Settings:

| Variable | Required | Default / Example | Description |
|---|---|---|---|
| `AWS_REGION` | Yes | `us-east-1` | AWS region where resources reside |
| `AWS_ACCESS_KEY_ID` | Yes | `AKIA...` | AWS access key with IAM rights |
| `AWS_SECRET_ACCESS_KEY` | Yes | `wJalr...` | AWS secret access key |
| `AWS_SESSION_TOKEN` | No | *(temporary STS)* | Optional temporary session token |
| `AWS_ACCOUNT_ID` | No | `123456789012` | AWS Account ID |
| `DYNAMODB_TABLE_NAME` | Yes | `noa-data` | Application DynamoDB table name |
| `DYNAMODB_TABLE_PARTITION_KEY` | No | `id` | Primary partition key (default `id`) |
| `S3_BUCKET` / `AWS_S3_BUCKET` | Yes | `noa-audio-production` | Main audio and reports S3 bucket |
| `BEDROCK_REGION` | No | `us-east-1` | Region for Bedrock calls (defaults to `AWS_REGION`) |
| `BEDROCK_NOVA_LITE_MODEL` | No | `amazon.nova-lite-v1:0` | Model ID for SOAP generation and triage |
| `BEDROCK_NOVA_PRO_MODEL` | No | `amazon.nova-pro-v1:0` | Model ID for complex clinical insights |
| `BEDROCK_SONIC_MODEL` | No | `amazon.nova-lite-v1:0` | Voice / real-time assistant model |
| `BEDROCK_MAX_TOKENS` | No | `2048` | Maximum output tokens per Bedrock call |
| `BEDROCK_TEMPERATURE` | No | `0.7` | Sampling temperature |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Fully qualified base URL |
| `NODE_ENV` | No | `development` / `production` | Execution environment |

---

## 4. Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# (Populate your AWS keys and bucket names in .env.local)

# 3. Start local development server
pnpm dev
```

The application runs at `http://localhost:3000`.

---

## 5. Deploying to Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. In the **Vercel Dashboard**, import the repository.
3. In **Project Settings → Environment Variables**, add the variables documented above (e.g. `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `DYNAMODB_TABLE_NAME`, `S3_BUCKET`, `NEXT_PUBLIC_APP_URL`).
4. Click **Deploy**. Vercel will automatically build and deploy the Next.js application.

---

## 6. Verification & Troubleshooting

### Verification Commands

```bash
# Verify API health check
curl http://localhost:3000/api/health

# Verify WebMCP discovery endpoint
curl http://localhost:3000/api/mcp -H "Accept: application/json"

# Verify AWS CLI connectivity
aws sts get-caller-identity
```

### Common Issues

1. **`ResourceNotFoundException` on DynamoDB**:
   - Ensure `DYNAMODB_TABLE_NAME` matches the table created by Terraform (default `noa-data`).
   - Check that `AWS_REGION` matches the region where the table was provisioned.

2. **`AccessDeniedException` on Bedrock**:
   - Ensure foundation model access has been approved in the AWS Bedrock Console under **Model access**.
   - Ensure the IAM user or role attached to the application credentials includes `bedrock:InvokeModel`.

3. **`AccessDenied` on S3 Uploads**:
   - Verify `S3_BUCKET` name is identical to the Terraform bucket output.
   - Confirm your IAM credentials permit `s3:PutObject` and `s3:GetObject` on `arn:aws:s3:::<bucket-name>/*`.
