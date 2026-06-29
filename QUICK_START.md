# Quick Start Guide - Fix Your InvalidIdentityToken Error

## The Problem
Your app is getting this error:
```
InvalidIdentityToken: No OpenIDConnect provider found in your account 
for https://oidc.vercel.com/leoemaxie
```

## The Solution (5 minutes)

### Option 1: Automated Setup (Recommended)

**Using Python:**
```bash
# Install boto3 if needed
pip install boto3

# Run setup script
python scripts/setup-aws-oidc.py
```

**Using Bash:**
```bash
# Make executable
chmod +x scripts/setup-aws-oidc.sh

# Run setup script
bash scripts/setup-aws-oidc.sh
```

Both scripts will:
1. Create the OIDC provider in AWS
2. Create the IAM role
3. Attach necessary policies
4. Create DynamoDB table and indexes
5. Print environment variables to add

### Option 2: Manual Setup

**Step 1: Create OIDC Provider in AWS**
```bash
aws iam create-open-id-connect-provider \
  --url https://oidc.vercel.com/leoemaxie \
  --thumbprint-list 9e99a48a9960b14926bb7f3b02e22da2b0ab7280 \
  --client-id-list aud:leoemaxie:prj_4HbC1y5bI1mCmDWPx2j50myj844I
```

**Step 2: Get your Account ID**
```bash
aws sts get-caller-identity --query Account --output text
```

**Step 3: Create IAM Role**
```bash
ACCOUNT_ID=YOUR_ACCOUNT_ID_HERE

cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/oidc.vercel.com/leoemaxie"
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
EOF

aws iam create-role \
  --role-name vercel-noa-app-role \
  --assume-role-policy-document file://trust-policy.json
```

**Step 4: Attach Policies**

DynamoDB:
```bash
cat > dynamodb-policy.json <<'EOF'
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
        "arn:aws:dynamodb:us-east-1:*:table/noa-data",
        "arn:aws:dynamodb:us-east-1:*:table/noa-data/index/*"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name vercel-noa-app-role \
  --policy-name DynamoDBAccess \
  --policy-document file://dynamodb-policy.json
```

Bedrock:
```bash
cat > bedrock-policy.json <<'EOF'
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
        "arn:aws:bedrock:us-east-1:*:foundation-model/amazon.nova-lite-v1:0",
        "arn:aws:bedrock:us-east-1:*:foundation-model/amazon.nova-pro-v1:0",
        "arn:aws:bedrock:us-east-1:*:foundation-model/us.anthropic.claude-3-5-sonnet-20241022"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name vercel-noa-app-role \
  --policy-name BedrockAccess \
  --policy-document file://bedrock-policy.json
```

**Step 5: Create DynamoDB Table**
```bash
aws dynamodb create-table \
  --table-name noa-data \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=email,AttributeType=S \
    AttributeName=type,AttributeType=S \
    AttributeName=doctorId,AttributeType=S \
    AttributeName=patientId,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "email-index",
        "KeySchema": [
          {"AttributeName": "email", "KeyType": "HASH"},
          {"AttributeName": "type", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "BillingMode": "PAY_PER_REQUEST"
      },
      {
        "IndexName": "doctorId-index",
        "KeySchema": [
          {"AttributeName": "doctorId", "KeyType": "HASH"},
          {"AttributeName": "type", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "BillingMode": "PAY_PER_REQUEST"
      },
      {
        "IndexName": "patientId-index",
        "KeySchema": [
          {"AttributeName": "patientId", "KeyType": "HASH"},
          {"AttributeName": "type", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "BillingMode": "PAY_PER_REQUEST"
      }
    ]'
```

### Step 3: Add Environment Variables to Vercel

After running the setup script (or manual steps), you'll get something like:
```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/vercel-noa-app-role
DYNAMODB_TABLE_NAME=noa-data
BEDROCK_REGION=us-east-1
BEDROCK_NOVA_LITE_MODEL=amazon.nova-lite-v1:0
BEDROCK_NOVA_PRO_MODEL=amazon.nova-pro-v1:0
```

Go to **Vercel Project Settings → Environment Variables** and add each one.

### Step 4: Deploy and Test

```bash
# Commit and push changes
git add .
git commit -m "AWS OIDC setup scripts and documentation"
git push

# Or just redeploy if env vars were updated:
# Visit https://vercel.com/leoemaxie/noa and click redeploy
```

After deployment, try the signup flow and it should work!

## Verification

Test if everything is working:

```bash
# Check OIDC provider exists
aws iam list-open-id-connect-providers | grep leoemaxie

# Check role exists
aws iam get-role --role-name vercel-noa-app-role

# Check table exists
aws dynamodb describe-table --table-name noa-data

# Check indexes
aws dynamodb describe-table --table-name noa-data \
  --query 'Table.GlobalSecondaryIndexes[].IndexName'
```

All should return successfully.

## Troubleshooting

If you still get an error:

1. **InvalidIdentityToken** - Run the setup script again
2. **AccessDenied** - Check IAM policies are attached: `aws iam list-role-policies --role-name vercel-noa-app-role`
3. **ResourceNotFound** - Check table exists: `aws dynamodb describe-table --table-name noa-data`

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more detailed help.

## What's Different Now?

Your app uses **Vercel's OIDC provider** instead of storing AWS credentials in environment variables. This means:

✅ More secure (no credentials in environment)
✅ No credential rotation needed
✅ Credentials are temporary and short-lived
✅ AWS handles authentication automatically

The `@vercel/functions/oidc` library handles all of this for you!

## Next Steps

1. Run the setup script ✓
2. Add environment variables to Vercel ✓
3. Deploy and test
4. Start building features!

If you run into issues, check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or [AWS_SETUP_GUIDE.md](./AWS_SETUP_GUIDE.md).
