# AWS OIDC Setup for Noa Medical SaaS

## Getting Started

Your app encountered an `InvalidIdentityToken` error because AWS hasn't been configured to trust Vercel yet. This guide will fix that.

## Quick Fix (2-5 minutes)

### Option 1: Automated Setup (Easiest)

```bash
# Python (Recommended)
pip install boto3
python scripts/setup-aws-oidc.py

# OR Bash
bash scripts/setup-aws-oidc.sh
```

The script will:
1. ✅ Create OIDC provider in AWS
2. ✅ Create IAM role with permissions
3. ✅ Create DynamoDB table with indexes
4. ✅ Print environment variables to add

### Option 2: Manual Setup

Follow the detailed instructions in [AWS_SETUP_GUIDE.md](./AWS_SETUP_GUIDE.md) to set up each component manually using AWS CLI.

## After Setup

### 1. Add Environment Variables to Vercel

The setup script outputs something like:
```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/vercel-noa-app-role
DYNAMODB_TABLE_NAME=noa-data
BEDROCK_REGION=us-east-1
BEDROCK_NOVA_LITE_MODEL=amazon.nova-lite-v1:0
BEDROCK_NOVA_PRO_MODEL=amazon.nova-pro-v1:0
```

Go to: **Vercel Project Settings → Environment Variables** and add each one.

### 2. Deploy

```bash
git add scripts/ *.md
git commit -m "Add AWS OIDC setup"
git push
```

### 3. Test

Visit `/auth/signup` and sign up. It should work now!

## File Overview

| File | Purpose |
|------|---------|
| `scripts/setup-aws-oidc.py` | Python setup script (recommended) |
| `scripts/setup-aws-oidc.sh` | Bash setup script |
| `QUICK_START.md` | Quick reference guide |
| `AWS_SETUP_GUIDE.md` | Detailed manual setup |
| `AWS_OIDC_SETUP_SUMMARY.md` | Full explanation of what's happening |
| `TROUBLESHOOTING.md` | Solutions for common errors |

## Troubleshooting

### "InvalidIdentityToken" Error

This means the OIDC provider hasn't been created. Run the setup script again:

```bash
python scripts/setup-aws-oidc.py
```

### "AccessDenied" Error

The IAM role doesn't have the right permissions. Verify policies are attached:

```bash
aws iam list-role-policies --role-name vercel-noa-app-role
```

Should show at least: `DynamoDBAccess`, `BedrockAccess`

### "ResourceNotFound" Error

The DynamoDB table doesn't exist. Check:

```bash
aws dynamodb describe-table --table-name noa-data
```

If not found, run the setup script again.

### Environment Variables Not Found

Make sure you've added them to Vercel and redeployed:

```bash
# Check Vercel has them
vercel env list

# Force redeploy
vercel --prod
```

## Detailed Help

- **New to AWS?** → Start with [QUICK_START.md](./QUICK_START.md)
- **Want full details?** → Read [AWS_OIDC_SETUP_SUMMARY.md](./AWS_OIDC_SETUP_SUMMARY.md)
- **Manual setup?** → Follow [AWS_SETUP_GUIDE.md](./AWS_SETUP_GUIDE.md)
- **Debugging?** → Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## What Happens Next

After setup is complete:

1. **Your app can access AWS** - DynamoDB, Bedrock, S3, etc.
2. **Users can sign up** - Data stored in DynamoDB
3. **Sessions work** - Doctor consultations saved
4. **AI features work** - SOAP notes generated with Bedrock

## Key Info

- **OIDC Provider:** `https://oidc.vercel.com/leoemaxie`
- **Audience:** `aud:leoemaxie:prj_4HbC1y5bI1mCmDWPx2j50myj844I`
- **IAM Role:** `vercel-noa-app-role`
- **DynamoDB Table:** `noa-data`
- **Region:** `us-east-1` (default)

## Security

This setup uses **OAuth 2.0 Web Identity Federation**, which is the recommended approach because:

✅ **No stored credentials** - Short-lived tokens only
✅ **Automatic rotation** - Credentials refresh hourly
✅ **Zero-trust model** - AWS verifies every request
✅ **Fine-grained control** - Permissions managed via IAM

## Support

If you get stuck:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for your error
2. Review the appropriate setup guide
3. Run the setup script again if needed

## Ready?

```bash
# Start setup
python scripts/setup-aws-oidc.py

# Add env vars to Vercel, then:
git push

# Test
# Visit http://localhost:3001/auth/signup or your Vercel deployment
```

You're all set! 🚀
