# AWS OIDC Setup - Complete Index

## 🎯 Your Problem

```
Error: InvalidIdentityToken: No OpenIDConnect provider found in your account 
for https://oidc.vercel.com/leoemaxie
```

**Root Cause:** AWS hasn't been configured to trust Vercel's OIDC provider

**Solution:** Run the setup scripts to create all necessary AWS resources (2-5 minutes)

---

## 📦 What Was Created for You

### ✅ Automated Setup Scripts (Ready to Run)

```
scripts/
├── setup-aws-oidc.py          ← Python setup (RECOMMENDED)
└── setup-aws-oidc.sh          ← Bash setup (alternative)
```

Both scripts automate:
- ✓ Create OIDC provider in AWS
- ✓ Create IAM role with permissions  
- ✓ Attach DynamoDB access policy
- ✓ Attach Bedrock access policy
- ✓ Create DynamoDB table (noa-data)
- ✓ Create 3 Global Secondary Indexes
- ✓ Print environment variables to add

**Time:** 2-5 minutes (everything automated)

### 📚 Complete Documentation (8 Guides)

| File | Purpose | Read Time | Best For |
|------|---------|-----------|----------|
| **REFERENCE_CARD.md** | One-page quick ref | 2 min | Everyone |
| **AWS_SETUP_README.md** | Getting started | 2 min | First-time |
| **QUICK_START.md** | Step-by-step guide | 5 min | Quickstart |
| **AWS_SETUP_GUIDE.md** | Manual setup | 15 min | Learning |
| **AWS_OIDC_SETUP_SUMMARY.md** | Full explanation | 20 min | Understanding |
| **TROUBLESHOOTING.md** | Error solutions | 10 min | Debugging |
| **SETUP_COMPLETE.txt** | Summary | 5 min | Overview |
| **AWS_OIDC_INDEX.md** | This file | 5 min | Navigation |

---

## 🚀 Quick Start (Choose One Path)

### Path 1: Just Fix It (Fastest - 10 min)
```bash
# 1. Run setup (2 min)
python scripts/setup-aws-oidc.py

# 2. Copy the 7 environment variables from output

# 3. Add to Vercel (1 min)
# Go to: Vercel → Project Settings → Environment Variables
# Paste each variable

# 4. Deploy (3 min)
git push

# 5. Test
# Visit /auth/signup - should work now!
```

### Path 2: Understand It (Recommended - 20 min)
1. Read [REFERENCE_CARD.md](./REFERENCE_CARD.md) (2 min)
2. Read [AWS_OIDC_SETUP_SUMMARY.md](./AWS_OIDC_SETUP_SUMMARY.md) (15 min)
3. Run setup script (2 min)
4. Add env vars & deploy (5 min)

### Path 3: Manual Setup (Learning - 25 min)
1. Read [AWS_SETUP_GUIDE.md](./AWS_SETUP_GUIDE.md) (15 min)
2. Run AWS CLI commands manually (10 min)
3. Add env vars & deploy (5 min)

### Path 4: Stuck? (Debugging)
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for your error
2. Follow the solution
3. Run setup script again if needed

---

## 🎓 Understanding What's Happening

### The Problem (Before Setup)
```
Your App → Calls AWS DynamoDB
         ↓
         AWS: "Who are you?"
         ↓
         App: "I'm from Vercel"
         ↓
         AWS: "I don't know Vercel. Get out."
         ↓
Error: InvalidIdentityToken ✗
```

### The Solution (After Setup)
```
Your App → Gets token from Vercel
         ↓
         Sends token to AWS
         ↓
         AWS: "Is this token from Vercel?"
         ↓
         [Checks with OIDC provider]
         ↓
         "Yes, it's valid"
         ↓
         Issues temporary credentials (1 hour)
         ↓
         App accesses DynamoDB successfully ✓
```

---

## 📋 Setup Checklist

- [ ] **Step 1:** Run setup script
  ```bash
  python scripts/setup-aws-oidc.py
  ```
  
- [ ] **Step 2:** Get 7 environment variables from script output

- [ ] **Step 3:** Add to Vercel
  - Go to: https://vercel.com/leoemaxie/noa
  - Settings → Environment Variables
  - Add all 7 variables
  
- [ ] **Step 4:** Deploy
  ```bash
  git add . && git commit -m "AWS OIDC setup" && git push
  ```
  
- [ ] **Step 5:** Wait for deployment (~3 min)

- [ ] **Step 6:** Test
  - Visit: `/auth/signup`
  - Should work without error!

---

## 🔧 The 7 Environment Variables

After running the setup script, you'll get something like this. Add all 7 to Vercel:

```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/vercel-noa-app-role
DYNAMODB_TABLE_NAME=noa-data
BEDROCK_REGION=us-east-1
BEDROCK_NOVA_LITE_MODEL=amazon.nova-lite-v1:0
BEDROCK_NOVA_PRO_MODEL=amazon.nova-pro-v1:0
```

**How to add to Vercel:**
1. Open: https://vercel.com/leoemaxie/noa
2. Click: Settings (top right)
3. Click: Environment Variables (left menu)
4. Click: Add New
5. Paste each variable one at a time
6. Redeploy

---

## ✅ Verification

After setup, verify everything worked:

```bash
# ✓ OIDC Provider created
aws iam list-open-id-connect-providers | grep leoemaxie

# ✓ IAM Role created
aws iam get-role --role-name vercel-noa-app-role

# ✓ DynamoDB table created
aws dynamodb describe-table --table-name noa-data

# ✓ Indexes created
aws dynamodb describe-table --table-name noa-data \
  --query 'Table.GlobalSecondaryIndexes[].IndexName'
# Should show: email-index, doctorId-index, patientId-index

# ✓ Environment variables set in Vercel
vercel env list
# Should show all 7 variables

# ✓ App working
# Visit /auth/signup - should work without error
```

---

## 🆘 If Something Goes Wrong

| Error | Solution |
|-------|----------|
| `InvalidIdentityToken` | Run setup script again: `python scripts/setup-aws-oidc.py` |
| `AccessDenied` | Check IAM policies: `aws iam list-role-policies --role-name vercel-noa-app-role` |
| `ResourceNotFound` | Check table: `aws dynamodb describe-table --table-name noa-data` |
| Env vars not showing | Make sure you added them all to Vercel and redeployed |
| Still not working | See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions |

---

## 📚 Which Document Should I Read?

### "I want to fix it NOW"
→ [REFERENCE_CARD.md](./REFERENCE_CARD.md)

### "I want a quick tutorial"
→ [AWS_SETUP_README.md](./AWS_SETUP_README.md)

### "I want step-by-step instructions"
→ [QUICK_START.md](./QUICK_START.md)

### "I want to understand everything"
→ [AWS_OIDC_SETUP_SUMMARY.md](./AWS_OIDC_SETUP_SUMMARY.md)

### "I want to do manual setup"
→ [AWS_SETUP_GUIDE.md](./AWS_SETUP_GUIDE.md)

### "Something is broken"
→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 🏗️ What Gets Created in AWS

### 1. OIDC Provider
- **URL:** `https://oidc.vercel.com/leoemaxie`
- **Purpose:** Tells AWS to trust Vercel tokens

### 2. IAM Role
- **Name:** `vercel-noa-app-role`
- **Purpose:** Grants permissions to your app

### 3. DynamoDB Policy
- **Resources:** `noa-data` table + indexes
- **Permissions:** Read/write patient data

### 4. Bedrock Policy
- **Resources:** Nova Lite, Nova Pro, Claude models
- **Permissions:** Call AI models for SOAP notes

### 5. DynamoDB Table
- **Name:** `noa-data`
- **Primary Key:** `id`
- **Indexes:** 3 Global Secondary Indexes
  - `email-index` → Query by email + type
  - `doctorId-index` → Query by doctor + type
  - `patientId-index` → Query by patient + type

---

## 💡 Key Concepts

### OIDC (OpenID Connect)
- Secure way to authenticate
- Uses temporary tokens
- Tokens auto-expire hourly
- No stored credentials

### IAM Role
- Defines what permissions app has
- Trust policy says only Vercel can use it
- Policies attached control exact access

### Temporary Credentials
- Issued by AWS STS (Security Token Service)
- Valid for 1 hour (refreshes automatically)
- More secure than long-lived keys

---

## 🎯 Next Steps

**Right now:**
1. Choose your path above
2. Run the setup script
3. Add environment variables
4. Deploy

**After setup:**
- Test signup flow
- Create doctor account
- Create patient data
- Start building features!

---

## 📞 Support Resources

### Documentation
- [AWS_SETUP_README.md](./AWS_SETUP_README.md) - Start here
- [QUICK_START.md](./QUICK_START.md) - Quick guide
- [AWS_OIDC_SETUP_SUMMARY.md](./AWS_OIDC_SETUP_SUMMARY.md) - Full details
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Error fixes

### AWS Documentation
- [Vercel OIDC Docs](https://vercel.com/docs/security/oidc-provider)
- [AWS IAM OIDC](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for_idp_oidc.html)
- [DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [Bedrock](https://docs.aws.amazon.com/bedrock/)

---

## ⚡ TL;DR (Too Long; Didn't Read)

```bash
# 1. Run setup
python scripts/setup-aws-oidc.py

# 2. Copy environment variables

# 3. Add to Vercel (Settings → Environment Variables)

# 4. Deploy
git push

# 5. Done! 🎉
```

---

## 🔗 File Structure

```
/vercel/share/v0-project/
├── scripts/
│   ├── setup-aws-oidc.py          ← RUN THIS
│   └── setup-aws-oidc.sh          ← OR THIS
├── AWS_OIDC_INDEX.md              ← You are here
├── REFERENCE_CARD.md              ← Quick ref
├── AWS_SETUP_README.md            ← Start here
├── QUICK_START.md                 ← Tutorial
├── AWS_SETUP_GUIDE.md             ← Manual setup
├── AWS_OIDC_SETUP_SUMMARY.md      ← Full explanation
├── TROUBLESHOOTING.md             ← Error fixes
└── SETUP_COMPLETE.txt             ← Summary
```

---

## 🚀 Ready?

**Run this command now:**
```bash
python scripts/setup-aws-oidc.py
```

Then follow the on-screen instructions to add environment variables to Vercel and deploy.

**That's it!** ✨

---

**Questions?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or re-read the relevant guide above.

**Not sure where to start?** Begin with [REFERENCE_CARD.md](./REFERENCE_CARD.md) - it's 2 minutes and will get you going!
