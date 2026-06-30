# AWS OIDC Setup Summary

## Problem Diagnosis

Your Noa Medical SaaS app is trying to use **Vercel's OpenID Connect (OIDC) provider** to authenticate with AWS. However, the required AWS configuration hasn't been set up yet.

**Error You're Seeing:**
```
InvalidIdentityToken: No OpenIDConnect provider found in your account 
for https://oidc.vercel.com/leoemaxie
```

**Why This Happens:**
- Your code uses `awsCredentialsProvider` from `@vercel/functions/oidc`
- This requires AWS to trust Vercel's OIDC provider
- AWS needs an OIDC provider, IAM role, and policies configured
- Without this, AWS can't verify that Vercel is authorized to access your resources

## Solution Overview

You need to set up 5 AWS resources:

1. **OIDC Provider** - Tells AWS to trust Vercel
2. **IAM Role** - Defines what permissions the app has
3. **DynamoDB Policy** - Allows database access
4. **Bedrock Policy** - Allows AI model access
5. **DynamoDB Table** - Your database with indexes

## Implementation Options

### Quick Option: Automated Setup Scripts

We've created two setup scripts that automate everything:

**Option A: Python (Recommended)**
```bash
pip install boto3
python scripts/setup-aws-oidc.py
```

**Option B: Bash**
```bash
chmod +x scripts/setup-aws-oidc.sh
bash scripts/setup-aws-oidc.sh
```

**What these scripts do:**
- Check your AWS Account ID
- Create the OIDC provider
- Create the IAM role
- Attach all necessary policies
- Create the DynamoDB table with 3 Global Secondary Indexes
- Print the environment variables you need to add

**Time:** ~2 minutes

### Detailed Option: Manual Setup

See [AWS_SETUP_GUIDE.md](./AWS_SETUP_GUIDE.md) for step-by-step instructions with AWS CLI commands.

**Time:** ~10-15 minutes

## Post-Setup Steps

### 1. Gather Environment Variables

From the setup script output (or AWS console), collect:
```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/vercel-noa-app-role
DYNAMODB_TABLE_NAME=noa-data
BEDROCK_REGION=us-east-1
BEDROCK_NOVA_LITE_MODEL=amazon.nova-lite-v1:0
BEDROCK_NOVA_PRO_MODEL=amazon.nova-pro-v1:0
```

### 2. Add to Vercel

**Steps:**
1. Go to https://vercel.com/leoemaxie/noa
2. Settings → Environment Variables
3. Add each variable from above
4. Save

### 3. Deploy

```bash
git add .
git commit -m "Add AWS OIDC setup scripts and docs"
git push
```

The app will automatically redeploy with the new environment variables.

### 4. Test

Try signing up at `/auth/signup` endpoint. It should now work without the InvalidIdentityToken error.

## What Each Component Does

### OIDC Provider
- **Purpose:** Allows Vercel to generate ID tokens that AWS trusts
- **Verifies:** That requests are coming from your Vercel project
- **Created in:** AWS IAM Console

### IAM Role
- **Purpose:** Grants permissions to your app when it runs on Vercel
- **Trust Policy:** Only allows the Vercel OIDC provider to assume the role
- **Created with:** Name `vercel-noa-app-role`

### DynamoDB Policy
- **Purpose:** Allows your app to read/write patient and session data
- **Permissions:** GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan, Batch operations
- **Resources:** `noa-data` table and all its indexes

### Bedrock Policy
- **Purpose:** Allows your app to call AI models for SOAP notes and voice processing
- **Permissions:** InvokeModel, InvokeModelWithResponseStream
- **Resources:** Nova Lite, Nova Pro, Claude models

### DynamoDB Table
- **Purpose:** Stores doctors, patients, sessions, intakes
- **Primary Key:** `id` (String)
- **Global Secondary Indexes:**
  - `email-index` → Query by email + type
  - `doctorId-index` → Query by doctor + type
  - `patientId-index` → Query by patient + type
- **Billing:** On-demand (pay only for what you use)

## How It Works

```
User Signs Up
    ↓
Vercel runs your Next.js app
    ↓
Code calls AWS (DynamoDB, Bedrock)
    ↓
@vercel/functions/oidc library:
  - Gets a token from Vercel's OIDC provider
  - Sends token to AWS STS
  - AWS verifies the token using the OIDC provider
  - AWS issues temporary credentials (valid for 1 hour)
    ↓
Your code uses credentials to access AWS services
    ↓
DynamoDB stores the new doctor/patient
```

**Security Benefits:**
- No long-lived credentials stored anywhere
- Credentials expire automatically
- AWS controls exactly what permissions the app has
- Easy to revoke access (delete the role)

## File Structure

**New Setup Files:**
```
scripts/
  ├── setup-aws-oidc.py          # Python setup (recommended)
  └── setup-aws-oidc.sh          # Bash setup (alternative)

Documentation/
  ├── AWS_SETUP_GUIDE.md         # Detailed manual setup
  ├── AWS_OIDC_SETUP_SUMMARY.md  # This file
  ├── QUICK_START.md             # Quick reference
  └── TROUBLESHOOTING.md         # Common errors & fixes
```

**Existing Code:**
```
lib/
  ├── aws-config.ts              # Uses awsCredentialsProvider
  └── db.ts                       # DynamoDB operations

app/api/auth/
  └── signup/route.ts            # Calls getDoctorByEmail (triggers DynamoDB query)
```

## Verification Checklist

After setup, verify everything with:

```bash
# ✓ OIDC Provider exists
aws iam list-open-id-connect-providers | grep leoemaxie

# ✓ IAM Role exists
aws iam get-role --role-name vercel-noa-app-role

# ✓ Role has policies
aws iam list-role-policies --role-name vercel-noa-app-role
# Should show: DynamoDBAccess, BedrockAccess

# ✓ DynamoDB table exists
aws dynamodb describe-table --table-name noa-data

# ✓ Indexes created
aws dynamodb describe-table --table-name noa-data \
  --query 'Table.GlobalSecondaryIndexes[].IndexName'
# Should show: email-index, doctorId-index, patientId-index

# ✓ Environment variables set
vercel env list
```

## Common Issues & Quick Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `InvalidIdentityToken` | OIDC provider not created | Run setup script again |
| `AccessDenied` | Missing IAM policies | Check policies attached to role |
| `ResourceNotFound` | DynamoDB table missing | Run setup script or create manually |
| `NoCredentialsProvider` | Env vars not set in Vercel | Add AWS env vars to Vercel Settings |
| `ValidationException` | Malformed query | Check ExpressionAttributeNames |

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed help.

## Cost Implications

**AWS Free Tier Included:**
- DynamoDB: 25 GB storage + 25 provisioned write capacity units (free)
- Bedrock: Model invocations are charged per token (no free tier)

**Typical Monthly Cost:**
- Development: $5-10 (light usage)
- Production: $20-100+ (depends on usage)

**How to Reduce Costs:**
- Use `amazon.nova-lite-v1:0` instead of Pro (cheaper)
- Cache AI responses when possible
- Use on-demand billing for DynamoDB (pay only for what you use)

## Next Steps

1. **Choose setup method:**
   - Fast: `python scripts/setup-aws-oidc.py`
   - Manual: Follow [AWS_SETUP_GUIDE.md](./AWS_SETUP_GUIDE.md)

2. **Add environment variables to Vercel**

3. **Deploy:** `git push`

4. **Test:** Visit `/auth/signup` and try signing up

5. **Debug if needed:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Support Resources

- **Vercel OIDC Docs:** https://vercel.com/docs/security/oidc-provider
- **AWS IAM OIDC:** https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for_idp_oidc.html
- **DynamoDB Docs:** https://docs.aws.amazon.com/dynamodb/
- **Bedrock Docs:** https://docs.aws.amazon.com/bedrock/

## Summary

Your app is security-configured to use **Vercel's OIDC provider** for AWS access. This is the **recommended approach** for Vercel + AWS integration because:

✅ **Secure** - No credentials stored in environment variables
✅ **Simple** - Automatic credential rotation
✅ **Scalable** - Works across all Vercel deployments
✅ **Cost-effective** - Pay only for what you use

The setup takes ~2-5 minutes with the provided scripts, then you're ready to build!
