# AWS OIDC Setup Guide for Vercel

## Overview
Your Next.js app is configured to use Vercel's OpenID Connect (OIDC) provider to securely authenticate with AWS without storing credentials. This guide walks through the one-time AWS setup required.

## Prerequisites
- AWS Account with appropriate permissions
- Vercel project connected to GitHub
- Environment variables from Vercel ready to add

## Step-by-Step Setup

### 1. Get Your Vercel Team Information
You'll need:
- **Vercel Team ID** (from Vercel dashboard → Settings → General)
- **Vercel Project ID** (visible in v0 project settings)

For this project:
- **Team ID**: `leoemaxie`
- **Project ID**: `prj_4HbC1y5bI1mCmDWPx2j50myj844I`

### 2. Create IAM OIDC Provider in AWS

Go to AWS Console → IAM → Identity providers → Add provider

**Provider Type**: OpenID Connect

**Provider URL**: 
```
https://oidc.vercel.com/leoemaxie
```

**Audience**:
```
aud:leoemaxie:prj_4HbC1y5bI1mCmDWPx2j50myj844I
```

**Thumbprint**: Leave as default (AWS will auto-populate)

### 3. Create IAM Role

In AWS Console → IAM → Roles → Create role

**Trusted entity**: Web identity
- **OIDC Provider**: Select the one you just created
- **Audience**: `aud:leoemaxie:prj_4HbC1y5bI1mCmDWPx2j50myj844I`

**Role name**: `vercel-noa-app-role`

### 4. Attach Policies to Role

Attach these policies to `vercel-noa-app-role`:

**Policy 1: DynamoDB Access**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:ACCOUNT_ID:table/noa-data",
        "arn:aws:dynamodb:*:ACCOUNT_ID:table/noa-data/index/*"
      ]
    }
  ]
}
```

**Policy 2: S3 Access** (for audio uploads)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    }
  ]
}
```

**Policy 3: Bedrock Access** (for Nova models)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*:ACCOUNT_ID:foundation-model/amazon.nova-lite-v1:0",
        "arn:aws:bedrock:*:ACCOUNT_ID:foundation-model/amazon.nova-pro-v1:0",
        "arn:aws:bedrock:*:ACCOUNT_ID:foundation-model/us.anthropic.claude-3-5-sonnet-20241022"
      ]
    }
  ]
}
```

> Replace `ACCOUNT_ID` with your AWS Account ID and `YOUR_BUCKET_NAME` with your S3 bucket name

### 5. Trust Policy Setup

The trust policy for the role should look like:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/oidc.vercel.com/leoemaxie"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.vercel.com/leoemaxie:aud": "aud:leoemaxie:prj_4HbC1y5bI1mCmDWPx2j50myj844I"
        }
      }
    }
  ]
}
```

### 6. Create DynamoDB Table

In AWS Console → DynamoDB → Create table:

**Table name**: `noa-data`
**Partition key**: `id` (String)

**Global Secondary Indexes**:
1. `email-index`
   - Partition key: `email` (String)
   - Sort key: `type` (String)
   - Billing: On-demand

2. `doctorId-index`
   - Partition key: `doctorId` (String)
   - Sort key: `type` (String)
   - Billing: On-demand

3. `patientId-index`
   - Partition key: `patientId` (String)
   - Sort key: `type` (String)
   - Billing: On-demand

**Billing mode**: On-demand

### 7. Create S3 Bucket

```bash
aws s3 mb s3://noa-medical-audio-ACCOUNT_ID --region us-east-1
```

Enable versioning and server-side encryption.

### 8. Set Environment Variables in Vercel

Go to Vercel Project Settings → Environment Variables and add:

```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=YOUR_ACCOUNT_ID
AWS_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/vercel-noa-app-role
DYNAMODB_TABLE_NAME=noa-data
S3_BUCKET=noa-medical-audio-ACCOUNT_ID
BEDROCK_REGION=us-east-1
BEDROCK_NOVA_LITE_MODEL=amazon.nova-lite-v1:0
BEDROCK_NOVA_PRO_MODEL=amazon.nova-pro-v1:0
```

## Verification

After setup, test your app by:

1. **Deploy to Vercel**: Push your changes
2. **Test Sign-up**: Go to `/signup` endpoint
3. **Check CloudWatch Logs**: Monitor DynamoDB requests in AWS CloudWatch

## Troubleshooting

### Error: "InvalidIdentityToken"
- **Cause**: OIDC provider not configured
- **Fix**: Ensure you completed steps 2-3 above

### Error: "AccessDenied"
- **Cause**: IAM role lacks permissions
- **Fix**: Check that all policies are attached to the role

### Error: "NoCredentialsProvider"
- **Cause**: Environment variables not set
- **Fix**: Verify all variables in step 8 are set in Vercel

### Error: "ResourceNotFoundException"
- **Cause**: DynamoDB table doesn't exist
- **Fix**: Create the table per step 6

## Next Steps

Once AWS is set up:
1. Deploy your app to Vercel: `git push`
2. Test the signup flow
3. Monitor logs in AWS CloudWatch
4. Create test patients and sessions

## Additional Resources

- [Vercel OIDC Documentation](https://vercel.com/docs/security/oidc-provider)
- [AWS IAM OIDC Providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for_idp_oidc.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
