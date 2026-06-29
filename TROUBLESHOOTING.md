# Troubleshooting Guide for Noa Medical SaaS

## Error: "InvalidIdentityToken: No OpenIDConnect provider found"

### Root Cause
The OIDC provider hasn't been created in your AWS account.

### Solution
1. Run the setup script:
   ```bash
   python scripts/setup-aws-oidc.py
   # or
   bash scripts/setup-aws-oidc.sh
   ```

2. Or manually create the OIDC provider:
   - Go to AWS Console → IAM → Identity Providers
   - Click "Add provider"
   - Select "OpenID Connect"
   - Provider URL: `https://oidc.vercel.com/leoemaxie`
   - Audience: `aud:leoemaxie:prj_4HbC1y5bI1mCmDWPx2j50myj844I`

### Verification
```bash
aws iam list-open-id-connect-providers | grep leoemaxie
```

---

## Error: "AccessDenied" / "User is not authorized"

### Root Cause
The IAM role doesn't have the required permissions, or the trust policy is incorrect.

### Solution

**Check Trust Policy:**
```bash
aws iam get-role --role-name vercel-noa-app-role \
  --query 'Role.AssumeRolePolicyDocument'
```

Should show:
```json
{
  "Effect": "Allow",
  "Principal": {
    "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/oidc.vercel.com/leoemaxie"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "oidc.vercel.com/leoemaxie:aud": "aud:leoemaxie:prj_4HbC1y5bI1mCmDWPx2j50myj844I"
    }
  }
}
```

**Check Attached Policies:**
```bash
aws iam list-role-policies --role-name vercel-noa-app-role
```

Should show at least:
- `DynamoDBAccess`
- `BedrockAccess`

**If missing, attach policies:**
```bash
# DynamoDB policy
aws iam put-role-policy --role-name vercel-noa-app-role \
  --policy-name DynamoDBAccess \
  --policy-document file://policies/dynamodb-policy.json

# Bedrock policy
aws iam put-role-policy --role-name vercel-noa-app-role \
  --policy-name BedrockAccess \
  --policy-document file://policies/bedrock-policy.json
```

---

## Error: "ResourceNotFoundException: Requested resource not found"

### Root Cause
DynamoDB table `noa-data` doesn't exist.

### Solution

**Check if table exists:**
```bash
aws dynamodb describe-table --table-name noa-data
```

**If not, create it:**
```bash
python scripts/setup-aws-oidc.py
```

Or manually:
```bash
aws dynamodb create-table \
  --table-name noa-data \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=email,AttributeType=S \
    AttributeName=type,AttributeType=S \
    AttributeName=doctorId,AttributeType=S \
    AttributeName=patientId,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

**Add Global Secondary Indexes:**
```bash
aws dynamodb update-table \
  --table-name noa-data \
  --attribute-definitions \
    AttributeName=email,AttributeType=S \
    AttributeName=type,AttributeType=S \
    AttributeName=doctorId,AttributeType=S \
    AttributeName=patientId,AttributeType=S \
  --global-secondary-index-updates \
    'Create={IndexName=email-index,KeySchema=[{AttributeName=email,KeyType=HASH},{AttributeName=type,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST}' \
    'Create={IndexName=doctorId-index,KeySchema=[{AttributeName=doctorId,KeyType=HASH},{AttributeName=type,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST}' \
    'Create={IndexName=patientId-index,KeySchema=[{AttributeName=patientId,KeyType=HASH},{AttributeName=type,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST}' \
  --region us-east-1
```

---

## Error: "NoCredentialsProvider" / "Unable to locate credentials"

### Root Cause
AWS environment variables are not set in Vercel.

### Solution

1. **Get credentials values:**
   ```bash
   # Get Account ID
   aws sts get-caller-identity --query Account --output text
   
   # Get Role ARN
   aws iam get-role --role-name vercel-noa-app-role --query 'Role.Arn' --output text
   ```

2. **Add to Vercel:**
   - Go to Vercel Project Settings → Environment Variables
   - Add:
     - `AWS_REGION`: `us-east-1`
     - `AWS_ACCOUNT_ID`: Your account ID
     - `AWS_ROLE_ARN`: The full role ARN
     - `DYNAMODB_TABLE_NAME`: `noa-data`
     - `BEDROCK_REGION`: `us-east-1`

3. **Redeploy:**
   ```bash
   git push
   ```

---

## Error: "Query validation error: Table KeySchema does not have a range key"

### Root Cause
You're querying a GSI with conditions that don't match the index schema.

### Solution

Check the query in `lib/db.ts` to ensure it matches the GSI schema:

**For `email-index`:**
- Partition Key: `email`
- Sort Key: `type`
- Valid query: `email = :email AND type = :type`

**For `doctorId-index`:**
- Partition Key: `doctorId`
- Sort Key: `type`
- Valid query: `doctorId = :doctorId AND type = :type`

---

## Error: "ValidationException: One or more parameter values were invalid"

### Root Cause
Malformed DynamoDB query parameters.

### Solution

**Common issues:**
1. Using undefined values in ExpressionAttributeValues
2. Missing ExpressionAttributeNames for reserved words
3. Type mismatch (String vs Number)

**Fix:**
```typescript
// ✗ Wrong - missing ExpressionAttributeNames
KeyConditionExpression: 'type = :type'

// ✓ Correct - reserved word escaped
KeyConditionExpression: '#type = :type',
ExpressionAttributeNames: {
  '#type': 'type'
}
```

---

## Error: "Bedrock model not found" / "ResourceNotFound"

### Root Cause
Bedrock is not available in your region, or the model doesn't exist.

### Solution

**Check available Bedrock models:**
```bash
aws bedrock list-foundation-models --region us-east-1
```

**Verify your models are listed:**
- `amazon.nova-lite-v1:0`
- `amazon.nova-pro-v1:0`
- `us.anthropic.claude-3-5-sonnet-20241022`

**If not available:**
1. Request model access in AWS console
2. Wait for approval (usually instant for Nova models)
3. Ensure `BEDROCK_REGION` is set correctly (e.g., `us-east-1` or `us-west-2`)

---

## Error: "ValidationException: 1 validation error detected"

### Root Cause
Invalid GSI name or attribute in query.

### Solution

**List available indexes:**
```bash
aws dynamodb describe-table --table-name noa-data --query 'Table.GlobalSecondaryIndexes[].IndexName'
```

**Expected output:**
```
email-index
doctorId-index
patientId-index
```

**Verify index exists before querying.**

---

## Debugging: Enable Detailed Logging

### In your code:

```typescript
// Add to lib/db.ts
import { logger } from './logger'

export async function getDoctorByEmail(email: string): Promise<Doctor | null> {
  try {
    console.log('[v0] Query params:', {
      TableName: TABLE_NAME,
      IndexName: 'email-index',
      email,
      type: 'doctor',
    })
    
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email AND #type = :type',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: {
          ':email': email,
          ':type': 'doctor',
        },
      }),
    )
    
    console.log('[v0] Query result:', result.Items?.length || 0, 'items found')
    return (result.Items?.[0] as Doctor) || null
  } catch (error) {
    console.error('[v0] Query error:', error)
    throw error
  }
}
```

### In Vercel logs:

```bash
# View logs from Vercel CLI
vercel logs production

# Or go to: Vercel Dashboard → Project → Deployments → Logs
```

---

## Checklist for Debugging

- [ ] OIDC provider exists: `aws iam list-open-id-connect-providers`
- [ ] IAM role exists: `aws iam get-role --role-name vercel-noa-app-role`
- [ ] Role has policies: `aws iam list-role-policies --role-name vercel-noa-app-role`
- [ ] DynamoDB table exists: `aws dynamodb describe-table --table-name noa-data`
- [ ] DynamoDB GSIs exist: Check table description for indexes
- [ ] Environment variables set in Vercel: Check Settings → Environment Variables
- [ ] Vercel app redeployed: After changing env vars, push and redeploy
- [ ] CloudWatch logs checked: Search for errors in logs
- [ ] Bedrock models available: `aws bedrock list-foundation-models --region us-east-1`

---

## Getting Help

1. **Check Vercel Logs:**
   ```bash
   vercel logs --follow production
   ```

2. **Check AWS CloudWatch:**
   - AWS Console → CloudWatch → Logs → Insights
   - Query: `/aws/dynamodb` or `/aws/bedrock`

3. **Test locally with AWS credentials:**
   ```bash
   AWS_PROFILE=default npm run dev
   ```

4. **Validate IAM role:**
   ```bash
   aws sts assume-role-with-web-identity \
     --role-arn arn:aws:iam::ACCOUNT_ID:role/vercel-noa-app-role \
     --role-session-name test \
     --web-identity-token $TOKEN \
     --duration-seconds 900
   ```

---

## Quick Verification Script

```bash
#!/bin/bash

echo "Checking AWS OIDC Setup..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✓ AWS Account: $ACCOUNT_ID"

ROLE=$(aws iam get-role --role-name vercel-noa-app-role --query 'Role.Arn' --output text)
echo "✓ IAM Role: $ROLE"

TABLE=$(aws dynamodb describe-table --table-name noa-data --query 'Table.TableName' --output text)
echo "✓ DynamoDB Table: $TABLE"

INDEXES=$(aws dynamodb describe-table --table-name noa-data --query 'Table.GlobalSecondaryIndexes[].IndexName' --output text)
echo "✓ GSIs: $INDEXES"

MODELS=$(aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[].modelId' --output text | grep -c "nova")
echo "✓ Bedrock Models Available: $MODELS"

echo ""
echo "All checks passed! Your AWS setup is ready."
```
