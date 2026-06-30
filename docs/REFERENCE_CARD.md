# AWS OIDC Setup - Reference Card

## Your Error

```
InvalidIdentityToken: No OpenIDConnect provider found in your account 
for https://oidc.vercel.com/leoemaxie
```

## The Fix (One Command)

```bash
python scripts/setup-aws-oidc.py
```

**Then add the environment variables it prints to Vercel and deploy.**

---

## What Gets Created

| AWS Resource | Purpose | Status |
|---|---|---|
| OIDC Provider | Allows Vercel to authenticate | Created by script ✓ |
| IAM Role | Grants permissions to your app | Created by script ✓ |
| DynamoDB Table | Stores doctor/patient/session data | Created by script ✓ |
| DynamoDB Indexes | Enables fast queries | Created by script ✓ |
| IAM Policies | Controls what app can do | Attached by script ✓ |

---

## Setup Checklist

- [ ] Run: `python scripts/setup-aws-oidc.py`
- [ ] Get output (7 environment variables)
- [ ] Go to Vercel → Project Settings → Environment Variables
- [ ] Add all 7 variables
- [ ] Run: `git add . && git commit -m "AWS setup" && git push`
- [ ] Wait for deployment
- [ ] Test at `/auth/signup`
- [ ] Done! ✓

---

## If Something Goes Wrong

| Error | Quick Fix |
|-------|-----------|
| `InvalidIdentityToken` | Run setup script again |
| `AccessDenied` | Check IAM policies: `aws iam list-role-policies --role-name vercel-noa-app-role` |
| `ResourceNotFound` | Check table: `aws dynamodb describe-table --table-name noa-data` |
| Env vars not set | Verify in Vercel: `vercel env list` |
| App still slow | Check Bedrock region: Should be `us-east-1` |

---

## Commands You'll Need

### Setup
```bash
pip install boto3
python scripts/setup-aws-oidc.py
```

### Verify
```bash
aws iam list-open-id-connect-providers | grep leoemaxie
aws iam get-role --role-name vercel-noa-app-role
aws dynamodb describe-table --table-name noa-data
```

### Deploy
```bash
git add . && git commit -m "AWS OIDC setup" && git push
```

### Check Status
```bash
# In Vercel
vercel env list
vercel logs production

# In AWS
aws iam list-role-policies --role-name vercel-noa-app-role
aws dynamodb describe-table --table-name noa-data --query 'Table.GlobalSecondaryIndexes[].IndexName'
```

---

## Environment Variables to Add

After running the script, you'll see something like this. Add all 7 to Vercel:

```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/vercel-noa-app-role
DYNAMODB_TABLE_NAME=noa-data
BEDROCK_REGION=us-east-1
BEDROCK_NOVA_LITE_MODEL=amazon.nova-lite-v1:0
BEDROCK_NOVA_PRO_MODEL=amazon.nova-pro-v1:0
```

**Location in Vercel:**
1. Open https://vercel.com/leoemaxie/noa
2. Click Settings (top right)
3. Choose Environment Variables (left menu)
4. Click "Add New"
5. Paste each variable one at a time

---

## How It Works

```
Before Setup (BROKEN):
  Request → AWS → Error: InvalidIdentityToken ✗

After Setup (WORKING):
  Request → Vercel OIDC → AWS IAM → Credentials ✓ → DynamoDB
```

---

## Important: 3 Setup Options

### Option 1: Python (Easiest - RECOMMENDED)
```bash
python scripts/setup-aws-oidc.py
```
- Fastest
- Creates everything automatically
- Requires: pip install boto3
- Best for: Everyone

### Option 2: Bash Script
```bash
bash scripts/setup-aws-oidc.sh
```
- Same as Python but in shell
- Requires: AWS CLI installed
- Best for: Bash lovers

### Option 3: Manual
See: `AWS_SETUP_GUIDE.md`
- Do each step manually
- Copy-paste AWS CLI commands
- Best for: Learning

---

## What the Setup Script Does

1. **Checks your AWS account** → Gets Account ID
2. **Creates OIDC provider** → Tells AWS to trust Vercel
3. **Creates IAM role** → Grants permissions
4. **Adds DynamoDB policy** → Access to table
5. **Adds Bedrock policy** → Access to AI models
6. **Creates DynamoDB table** → For data storage
7. **Creates 3 indexes** → For fast queries
8. **Prints environment variables** → For you to add to Vercel

**Total time:** ~2 minutes

---

## Step-by-Step Walkthrough

### Step 1: Setup AWS (2 min)
```bash
python scripts/setup-aws-oidc.py
```
✓ Creates all AWS resources automatically

### Step 2: Copy Variables (1 min)
Look at script output, copy 7 environment variables

### Step 3: Add to Vercel (1 min)
Project Settings → Environment Variables → Add all 7

### Step 4: Deploy (2 min)
```bash
git push
```
Wait for deployment to complete

### Step 5: Test (1 min)
Visit `/auth/signup` and try signing up

---

## Key AWS Resources Created

### OIDC Provider
```
URL: https://oidc.vercel.com/leoemaxie
Audience: aud:leoemaxie:prj_4HbC1y5bI1mCmDWPx2j50myj844I
```

### IAM Role
```
Name: vercel-noa-app-role
Policies:
  - DynamoDBAccess
  - BedrockAccess
```

### DynamoDB Table
```
Name: noa-data
Primary Key: id
Indexes:
  - email-index (query by email + type)
  - doctorId-index (query by doctor + type)
  - patientId-index (query by patient + type)
```

---

## Costs

### Development
- Free tier covers most testing
- ~$0-5/month

### Production
- DynamoDB: ~$1-10/month (pay-per-request)
- Bedrock: ~$5-50/month (depends on AI usage)
- Total: ~$5-50/month

---

## Security Benefits

✅ No credentials stored (uses temporary tokens)
✅ Auto-rotate every hour
✅ AWS verifies requests
✅ Fine-grained permissions
✅ Easy to revoke

---

## Documentation

- **Quick Start** → `QUICK_START.md`
- **Full Setup** → `AWS_SETUP_GUIDE.md`
- **Explanation** → `AWS_OIDC_SETUP_SUMMARY.md`
- **Troubleshooting** → `TROUBLESHOOTING.md`
- **Readme** → `AWS_SETUP_README.md`

---

## Verification

Everything worked if these commands succeed:

```bash
✓ aws iam list-open-id-connect-providers | grep leoemaxie
✓ aws iam get-role --role-name vercel-noa-app-role
✓ aws dynamodb describe-table --table-name noa-data
✓ vercel env list (shows 7 variables)
✓ Signup page works without error
```

---

## Can't Get It Working?

1. **Read TROUBLESHOOTING.md** for your specific error
2. **Check AWS resources exist** (verify commands above)
3. **Run setup script again** if needed
4. **Check Vercel env vars** (should be 7 of them)
5. **Redeploy** if env vars were just added

---

## Time Estimate

- Setup script: 2 min
- Add to Vercel: 1 min
- Deploy: 3 min
- Test: 1 min
- **Total: 7 minutes**

---

## Go! 🚀

```bash
python scripts/setup-aws-oidc.py
```

Then add the environment variables to Vercel and deploy.

**You're done!**
