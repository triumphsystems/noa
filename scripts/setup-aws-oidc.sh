#!/bin/bash

# AWS OIDC Setup Script for Vercel + Noa Medical SaaS
# This script automates the AWS configuration for Vercel OIDC integration

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VERCEL_TEAM_ID="leoemaxie"
VERCEL_PROJECT_ID="prj_4HbC1y5bI1mCmDWPx2j50myj844I"
OIDC_PROVIDER_URL="https://oidc.vercel.com/${VERCEL_TEAM_ID}"
AUDIENCE="aud:${VERCEL_TEAM_ID}:${VERCEL_PROJECT_ID}"
ROLE_NAME="vercel-noa-app-role"
OIDC_PROVIDER_NAME="vercel-${VERCEL_TEAM_ID}"
DYNAMODB_TABLE="noa-data"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo -e "${YELLOW}=== AWS OIDC Setup for Vercel ===${NC}"
echo ""

# Step 1: Get AWS Account ID
echo -e "${YELLOW}Step 1: Getting AWS Account ID...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}Error: Could not get AWS Account ID. Ensure AWS CLI is configured.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ AWS Account ID: $AWS_ACCOUNT_ID${NC}"
echo ""

# Step 2: Create OIDC Provider
echo -e "${YELLOW}Step 2: Creating OIDC Provider...${NC}"
THUMBPRINT="9e99a48a9960b14926bb7f3b02e22da2b0ab7280"  # Vercel's thumbprint

EXISTING_PROVIDER=$(aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?contains(Arn, '${VERCEL_TEAM_ID}')].Arn" --output text 2>/dev/null || echo "")

if [ -z "$EXISTING_PROVIDER" ]; then
    echo "Creating new OIDC provider: $OIDC_PROVIDER_URL"
    OIDC_ARN=$(aws iam create-open-id-connect-provider \
        --url "$OIDC_PROVIDER_URL" \
        --thumbprint-list "$THUMBPRINT" \
        --client-id-list "$AUDIENCE" \
        --query 'OpenIDConnectProviderArn' \
        --output text)
    echo -e "${GREEN}✓ Created OIDC Provider: $OIDC_ARN${NC}"
else
    OIDC_ARN=$EXISTING_PROVIDER
    echo -e "${GREEN}✓ OIDC Provider already exists: $OIDC_ARN${NC}"
fi
echo ""

# Step 3: Create Trust Policy
echo -e "${YELLOW}Step 3: Creating IAM Role with Trust Policy...${NC}"

TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/oidc.vercel.com/${VERCEL_TEAM_ID}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.vercel.com/${VERCEL_TEAM_ID}:aud": "${AUDIENCE}"
        }
      }
    }
  ]
}
EOF
)

# Check if role exists
EXISTING_ROLE=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$EXISTING_ROLE" ]; then
    echo "Creating new IAM role: $ROLE_NAME"
    ROLE_ARN=$(aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document "$TRUST_POLICY" \
        --query 'Role.Arn' \
        --output text)
    echo -e "${GREEN}✓ Created IAM Role: $ROLE_ARN${NC}"
else
    ROLE_ARN=$EXISTING_ROLE
    echo -e "${GREEN}✓ IAM Role already exists: $ROLE_ARN${NC}"
    # Update trust policy
    aws iam update-assume-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-document "$TRUST_POLICY"
    echo -e "${GREEN}✓ Updated trust policy${NC}"
fi
echo ""

# Step 4: Attach Policies
echo -e "${YELLOW}Step 4: Attaching policies to role...${NC}"

# DynamoDB Policy
DYNAMODB_POLICY=$(cat <<EOF
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
        "arn:aws:dynamodb:${AWS_REGION}:${AWS_ACCOUNT_ID}:table/${DYNAMODB_TABLE}",
        "arn:aws:dynamodb:${AWS_REGION}:${AWS_ACCOUNT_ID}:table/${DYNAMODB_TABLE}/index/*"
      ]
    }
  ]
}
EOF
)

aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "DynamoDBAccess" \
    --policy-document "$DYNAMODB_POLICY"
echo -e "${GREEN}✓ Attached DynamoDB policy${NC}"

# S3 Policy (if bucket provided)
if [ ! -z "$S3_BUCKET" ]; then
    S3_POLICY=$(cat <<EOF
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
        "arn:aws:s3:::${S3_BUCKET}",
        "arn:aws:s3:::${S3_BUCKET}/*"
      ]
    }
  ]
}
EOF
)
    aws iam put-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-name "S3Access" \
        --policy-document "$S3_POLICY"
    echo -e "${GREEN}✓ Attached S3 policy${NC}"
fi

# Bedrock Policy
BEDROCK_POLICY=$(cat <<EOF
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
        "arn:aws:bedrock:${AWS_REGION}:${AWS_ACCOUNT_ID}:foundation-model/amazon.nova-lite-v1:0",
        "arn:aws:bedrock:${AWS_REGION}:${AWS_ACCOUNT_ID}:foundation-model/amazon.nova-pro-v1:0",
        "arn:aws:bedrock:${AWS_REGION}:${AWS_ACCOUNT_ID}:foundation-model/us.anthropic.claude-3-5-sonnet-20241022"
      ]
    }
  ]
}
EOF
)

aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "BedrockAccess" \
    --policy-document "$BEDROCK_POLICY"
echo -e "${GREEN}✓ Attached Bedrock policy${NC}"
echo ""

# Step 5: Create DynamoDB Table
echo -e "${YELLOW}Step 5: Creating DynamoDB Table...${NC}"

TABLE_EXISTS=$(aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" --query 'Table.TableName' --output text 2>/dev/null || echo "")

if [ -z "$TABLE_EXISTS" ]; then
    echo "Creating DynamoDB table: $DYNAMODB_TABLE"
    aws dynamodb create-table \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
            AttributeName=email,AttributeType=S \
            AttributeName=type,AttributeType=S \
            AttributeName=doctorId,AttributeType=S \
            AttributeName=patientId,AttributeType=S \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --global-secondary-indexes \
            "[
                {
                    \"IndexName\": \"email-index\",
                    \"KeySchema\": [
                        {\"AttributeName\": \"email\", \"KeyType\": \"HASH\"},
                        {\"AttributeName\": \"type\", \"KeyType\": \"RANGE\"}
                    ],
                    \"Projection\": {\"ProjectionType\": \"ALL\"},
                    \"BillingMode\": \"PAY_PER_REQUEST\"
                },
                {
                    \"IndexName\": \"doctorId-index\",
                    \"KeySchema\": [
                        {\"AttributeName\": \"doctorId\", \"KeyType\": \"HASH\"},
                        {\"AttributeName\": \"type\", \"KeyType\": \"RANGE\"}
                    ],
                    \"Projection\": {\"ProjectionType\": \"ALL\"},
                    \"BillingMode\": \"PAY_PER_REQUEST\"
                },
                {
                    \"IndexName\": \"patientId-index\",
                    \"KeySchema\": [
                        {\"AttributeName\": \"patientId\", \"KeyType\": \"HASH\"},
                        {\"AttributeName\": \"type\", \"KeyType\": \"RANGE\"}
                    ],
                    \"Projection\": {\"ProjectionType\": \"ALL\"},
                    \"BillingMode\": \"PAY_PER_REQUEST\"
                }
            ]" \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION"
    
    echo -e "${GREEN}✓ Created DynamoDB table: $DYNAMODB_TABLE${NC}"
    echo "Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION"
    echo -e "${GREEN}✓ Table is active${NC}"
else
    echo -e "${GREEN}✓ DynamoDB table already exists: $DYNAMODB_TABLE${NC}"
fi
echo ""

# Step 6: Output Configuration
echo -e "${YELLOW}Step 6: Configuration Summary${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo ""
echo "Add these environment variables to Vercel:"
echo ""
echo "AWS_REGION=$AWS_REGION"
echo "AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID"
echo "AWS_ROLE_ARN=$ROLE_ARN"
echo "DYNAMODB_TABLE_NAME=$DYNAMODB_TABLE"
echo "BEDROCK_REGION=$AWS_REGION"
echo "BEDROCK_NOVA_LITE_MODEL=amazon.nova-lite-v1:0"
echo "BEDROCK_NOVA_PRO_MODEL=amazon.nova-pro-v1:0"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Copy the environment variables above"
echo "2. Go to Vercel Project Settings → Environment Variables"
echo "3. Add each variable"
echo "4. Deploy your app: git push"
echo "5. Test the signup flow"
echo ""
