#!/usr/bin/env python3
"""
AWS OIDC Setup Script for Vercel + Noa Medical SaaS
Automates the AWS configuration for Vercel OIDC integration
"""

import boto3
import json
import sys
from typing import Optional

# Color codes
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

# Configuration
VERCEL_TEAM_ID = "leoemaxie"
VERCEL_PROJECT_ID = "prj_4HbC1y5bI1mCmDWPx2j50myj844I"
OIDC_PROVIDER_URL = f"https://oidc.vercel.com/{VERCEL_TEAM_ID}"
AUDIENCE = f"aud:{VERCEL_TEAM_ID}:{VERCEL_PROJECT_ID}"
ROLE_NAME = "vercel-noa-app-role"
DYNAMODB_TABLE = "noa-data"
THUMBPRINT = "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"
AWS_REGION = "us-east-1"

def print_success(msg: str):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg: str):
    print(f"{RED}✗ {msg}{RESET}")

def print_info(msg: str):
    print(f"{YELLOW}→ {msg}{RESET}")

def get_aws_account_id(sts_client) -> Optional[str]:
    """Get AWS Account ID"""
    try:
        response = sts_client.get_caller_identity()
        return response['Account']
    except Exception as e:
        print_error(f"Could not get AWS Account ID: {str(e)}")
        return None

def create_oidc_provider(iam_client, account_id: str) -> Optional[str]:
    """Create or get OIDC Provider"""
    try:
        print_info(f"Checking for existing OIDC provider...")
        existing = iam_client.list_open_id_connect_providers()
        
        for provider in existing['OpenIDConnectProviderList']:
            if VERCEL_TEAM_ID in provider['Arn']:
                print_success(f"OIDC provider already exists: {provider['Arn']}")
                return provider['Arn']
        
        print_info(f"Creating OIDC provider: {OIDC_PROVIDER_URL}")
        response = iam_client.create_open_id_connect_provider(
            Url=OIDC_PROVIDER_URL,
            ClientIDList=[AUDIENCE],
            ThumbprintList=[THUMBPRINT]
        )
        print_success(f"Created OIDC Provider: {response['OpenIDConnectProviderArn']}")
        return response['OpenIDConnectProviderArn']
    except Exception as e:
        print_error(f"Failed to create OIDC provider: {str(e)}")
        return None

def create_trust_policy(account_id: str) -> str:
    """Generate trust policy JSON"""
    return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Federated": f"arn:aws:iam::{account_id}:oidc-provider/oidc.vercel.com/{VERCEL_TEAM_ID}"
                },
                "Action": "sts:AssumeRoleWithWebIdentity",
                "Condition": {
                    "StringEquals": {
                        f"oidc.vercel.com/{VERCEL_TEAM_ID}:aud": AUDIENCE
                    }
                }
            }
        ]
    })

def create_iam_role(iam_client, account_id: str) -> Optional[str]:
    """Create or get IAM Role"""
    try:
        print_info("Checking for existing IAM role...")
        response = iam_client.get_role(RoleName=ROLE_NAME)
        print_success(f"IAM role already exists: {response['Role']['Arn']}")
        
        # Update trust policy
        trust_policy = create_trust_policy(account_id)
        iam_client.update_assume_role_policy(
            RoleName=ROLE_NAME,
            PolicyDocument=trust_policy
        )
        print_success("Updated trust policy")
        return response['Role']['Arn']
    except iam_client.exceptions.NoSuchEntityException:
        print_info(f"Creating new IAM role: {ROLE_NAME}")
        trust_policy = create_trust_policy(account_id)
        response = iam_client.create_role(
            RoleName=ROLE_NAME,
            AssumeRolePolicyDocument=trust_policy,
            Description="Role for Vercel OIDC integration with Noa Medical SaaS"
        )
        print_success(f"Created IAM Role: {response['Role']['Arn']}")
        return response['Role']['Arn']
    except Exception as e:
        print_error(f"Failed to create IAM role: {str(e)}")
        return None

def attach_dynamodb_policy(iam_client) -> bool:
    """Attach DynamoDB policy"""
    try:
        policy = {
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
                        f"arn:aws:dynamodb:{AWS_REGION}:*:table/{DYNAMODB_TABLE}",
                        f"arn:aws:dynamodb:{AWS_REGION}:*:table/{DYNAMODB_TABLE}/index/*"
                    ]
                }
            ]
        }
        iam_client.put_role_policy(
            RoleName=ROLE_NAME,
            PolicyName="DynamoDBAccess",
            PolicyDocument=json.dumps(policy)
        )
        print_success("Attached DynamoDB policy")
        return True
    except Exception as e:
        print_error(f"Failed to attach DynamoDB policy: {str(e)}")
        return False

def attach_bedrock_policy(iam_client) -> bool:
    """Attach Bedrock policy"""
    try:
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "bedrock:InvokeModel",
                        "bedrock:InvokeModelWithResponseStream"
                    ],
                    "Resource": [
                        f"arn:aws:bedrock:{AWS_REGION}:*:foundation-model/amazon.nova-lite-v1:0",
                        f"arn:aws:bedrock:{AWS_REGION}:*:foundation-model/amazon.nova-pro-v1:0",
                        f"arn:aws:bedrock:{AWS_REGION}:*:foundation-model/us.anthropic.claude-3-5-sonnet-20241022"
                    ]
                }
            ]
        }
        iam_client.put_role_policy(
            RoleName=ROLE_NAME,
            PolicyName="BedrockAccess",
            PolicyDocument=json.dumps(policy)
        )
        print_success("Attached Bedrock policy")
        return True
    except Exception as e:
        print_error(f"Failed to attach Bedrock policy: {str(e)}")
        return False

def create_dynamodb_table(dynamodb_client) -> bool:
    """Create DynamoDB table if it doesn't exist"""
    try:
        # Check if table exists
        try:
            dynamodb_client.describe_table(TableName=DYNAMODB_TABLE)
            print_success(f"DynamoDB table already exists: {DYNAMODB_TABLE}")
            return True
        except dynamodb_client.exceptions.ResourceNotFoundException:
            pass
        
        print_info(f"Creating DynamoDB table: {DYNAMODB_TABLE}")
        
        # Create table with GSIs
        dynamodb_client.create_table(
            TableName=DYNAMODB_TABLE,
            KeySchema=[
                {'AttributeName': 'id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'id', 'AttributeType': 'S'},
                {'AttributeName': 'email', 'AttributeType': 'S'},
                {'AttributeName': 'type', 'AttributeType': 'S'},
                {'AttributeName': 'doctorId', 'AttributeType': 'S'},
                {'AttributeName': 'patientId', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'email-index',
                    'KeySchema': [
                        {'AttributeName': 'email', 'KeyType': 'HASH'},
                        {'AttributeName': 'type', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                    'BillingMode': 'PAY_PER_REQUEST'
                },
                {
                    'IndexName': 'doctorId-index',
                    'KeySchema': [
                        {'AttributeName': 'doctorId', 'KeyType': 'HASH'},
                        {'AttributeName': 'type', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                    'BillingMode': 'PAY_PER_REQUEST'
                },
                {
                    'IndexName': 'patientId-index',
                    'KeySchema': [
                        {'AttributeName': 'patientId', 'KeyType': 'HASH'},
                        {'AttributeName': 'type', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                    'BillingMode': 'PAY_PER_REQUEST'
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # Wait for table to be created
        print_info("Waiting for table to be active...")
        waiter = dynamodb_client.get_waiter('table_exists')
        waiter.wait(TableName=DYNAMODB_TABLE)
        print_success(f"DynamoDB table created: {DYNAMODB_TABLE}")
        return True
    except Exception as e:
        print_error(f"Failed to create DynamoDB table: {str(e)}")
        return False

def main():
    print(f"\n{YELLOW}=== AWS OIDC Setup for Vercel ==={RESET}\n")
    
    try:
        # Initialize clients
        sts_client = boto3.client('sts', region_name=AWS_REGION)
        iam_client = boto3.client('iam', region_name=AWS_REGION)
        dynamodb_client = boto3.client('dynamodb', region_name=AWS_REGION)
        
        # Step 1: Get Account ID
        print_info("Step 1: Getting AWS Account ID...")
        account_id = get_aws_account_id(sts_client)
        if not account_id:
            sys.exit(1)
        print_success(f"AWS Account ID: {account_id}\n")
        
        # Step 2: Create OIDC Provider
        print_info("Step 2: Creating OIDC Provider...")
        oidc_arn = create_oidc_provider(iam_client, account_id)
        if not oidc_arn:
            sys.exit(1)
        print()
        
        # Step 3: Create IAM Role
        print_info("Step 3: Creating IAM Role...")
        role_arn = create_iam_role(iam_client, account_id)
        if not role_arn:
            sys.exit(1)
        print()
        
        # Step 4: Attach Policies
        print_info("Step 4: Attaching policies...")
        if not attach_dynamodb_policy(iam_client):
            sys.exit(1)
        if not attach_bedrock_policy(iam_client):
            sys.exit(1)
        print()
        
        # Step 5: Create DynamoDB Table
        print_info("Step 5: Creating DynamoDB Table...")
        if not create_dynamodb_table(dynamodb_client):
            sys.exit(1)
        print()
        
        # Step 6: Output configuration
        print_info("Step 6: Configuration Summary\n")
        print(f"{GREEN}✓ Setup Complete!{RESET}\n")
        print("Add these environment variables to Vercel:\n")
        print(f"AWS_REGION={AWS_REGION}")
        print(f"AWS_ACCOUNT_ID={account_id}")
        print(f"AWS_ROLE_ARN={role_arn}")
        print(f"DYNAMODB_TABLE_NAME={DYNAMODB_TABLE}")
        print(f"BEDROCK_REGION={AWS_REGION}")
        print(f"BEDROCK_NOVA_LITE_MODEL=amazon.nova-lite-v1:0")
        print(f"BEDROCK_NOVA_PRO_MODEL=amazon.nova-pro-v1:0")
        print()
        print(f"{YELLOW}Next Steps:{RESET}")
        print("1. Copy the environment variables above")
        print("2. Go to Vercel Project Settings → Environment Variables")
        print("3. Add each variable")
        print("4. Deploy your app: git push")
        print("5. Test the signup flow\n")
        
    except Exception as e:
        print_error(f"Setup failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
