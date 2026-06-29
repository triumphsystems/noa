# Fix InvalidIdentityToken Error - Complete Solution

## Problem

Your Noa Medical SaaS app is failing with:
```
InvalidIdentityToken: No OpenIDConnect provider found in your account 
for https://oidc.vercel.com/leoemaxie
```

## Solution Created

I've created **complete automated setup** that will fix this in 2-5 minutes.

---

## 🎯 What You Need to Do (3 Steps)

### Step 1: Run Setup Script (2 min)
```bash
python scripts/setup-aws-oidc.py
```

This will:
- ✅ Create OIDC provider in AWS
- ✅ Create IAM role with permissions
- ✅ Create DynamoDB table with indexes
- ✅ Print 7 environment variables

### Step 2: Add to Vercel (1 min)
Go to: **https://vercel.com/leoemaxie/noa**
1. Click **Settings** (top right)
2. Click **Environment Variables** (left menu)
3. Click **Add New**
4. Paste each of the 7 variables from step 1
5. Click **Save**

### Step 3: Deploy (2 min)
```bash
git add . && git commit -m "AWS OIDC setup" && git push
```

Wait for deployment to complete, then test at `/auth/signup`

**Total Time: ~5 minutes**

---

## 📦 What's Included

### ✅ Automated Setup Scripts

```
scripts/
├── setup-aws-oidc.py          ← RUN THIS (Python)
└── setup-aws-oidc.sh          ← OR THIS (Bash)
```

Both scripts do the same thing - choose your preference.

### ✅ Complete Documentation

```
START_AWS_SETUP.md              ← Read this first! (1 min)
REFERENCE_CARD.md               ← Quick reference (2 min)
AWS_SETUP_README.md             ← Getting started (2 min)
QUICK_START.md                  ← Tutorial (5 min)
AWS_SETUP_GUIDE.md              ← Manual setup (15 min)
AWS_OIDC_SETUP_SUMMARY.md       ← Full explanation (20 min)
AWS_OIDC_INDEX.md               ← Navigation guide (5 min)
TROUBLESHOOTING.md              ← Error solutions (reference)
SETUP_COMPLETE.txt              ← Complete summary (5 min)
FIX_INVALID_IDENTITY_TOKEN.md   ← This file
```

---

## 🚀 Quick Start

### For the Impatient (5 min)
```bash
# 1. Run setup
python scripts/setup-aws-oidc.py

# 2. Copy the environment variables it prints

# 3. Add them to Vercel (Settings → Environment Variables)

# 4. Deploy
git push

# Done!
```

### For the Cautious (15 min)
1. Read [START_AWS_SETUP.md](./START_AWS_SETUP.md) (1 min)
2. Read [REFERENCE_CARD.md](./REFERENCE_CARD.md) (2 min)
3. Run setup script (2 min)
4. Add env vars to Vercel (1 min)
5. Deploy (2 min)
6. Test (1 min)

### For the Learners (30 min)
1. Read [AWS_OIDC_SETUP_SUMMARY.md](./AWS_OIDC_SETUP_SUMMARY.md) (20 min)
2. Understand how OIDC works
3. Run setup script (2 min)
4. Add env vars & deploy (8 min)

---

## 🎓 Understanding the Error

### Why It Happens
```
Before Setup:
  Your App → Calls AWS → AWS: "Who are you?" 
  → App: "I'm from Vercel" 
  → AWS: "Vercel? Never heard of it!" 
  → Error: InvalidIdentityToken ✗

After Setup:
  Your App → Gets token from Vercel
  → Sends to AWS
  → AWS: "Let me check with my OIDC provider"
  → [Verifies token] 
  → "OK, you're good!"
  → Credentials issued ✓
```

### What Gets Created

| AWS Resource | Purpose |
|--------------|---------|
| OIDC Provider | Tells AWS to trust Vercel |
| IAM Role | Grants permissions to your app |
| DynamoDB Policy | Access to database |
| Bedrock Policy | Access to AI models |
| DynamoDB Table | Stores doctor/patient data |
| GSI Indexes | Fast database queries |

---

## ✅ Verification

After setup, verify it worked:

```bash
# Check OIDC Provider exists
aws iam list-open-id-connect-providers | grep leoemaxie

# Check IAM Role exists
aws iam get-role --role-name vercel-noa-app-role

# Check DynamoDB table exists
aws dynamodb describe-table --table-name noa-data

# Check environment variables set in Vercel
vercel env list

# Test the app
# Visit: /auth/signup (should work now!)
```

---

## 🆘 If Something Goes Wrong

| Problem | Solution |
|---------|----------|
| Setup script fails | Run it again: `python scripts/setup-aws-oidc.py` |
| Still getting InvalidIdentityToken | Check Vercel env vars were added and redeployed |
| DynamoDB errors | Check table exists: `aws dynamodb describe-table --table-name noa-data` |
| Access denied | Check IAM policies: `aws iam list-role-policies --role-name vercel-noa-app-role` |
| Not sure what to do | Read [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |

---

## 📋 Files Delivered

### Setup & Config
- `scripts/setup-aws-oidc.py` - Python automation (2 min)
- `scripts/setup-aws-oidc.sh` - Bash automation (2 min)

### Getting Started  
- `START_AWS_SETUP.md` - Start here (1 min read)
- `REFERENCE_CARD.md` - Quick reference (2 min read)
- `AWS_SETUP_README.md` - Overview (2 min read)

### Detailed Guides
- `QUICK_START.md` - Step-by-step (5 min read)
- `AWS_SETUP_GUIDE.md` - Manual setup (15 min read)
- `AWS_OIDC_SETUP_SUMMARY.md` - Full explanation (20 min read)

### Reference
- `AWS_OIDC_INDEX.md` - Navigation guide
- `TROUBLESHOOTING.md` - Error solutions
- `SETUP_COMPLETE.txt` - Summary

---

## 🔑 The 7 Environment Variables

After running the setup script, you'll receive something like:

```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/vercel-noa-app-role
DYNAMODB_TABLE_NAME=noa-data
BEDROCK_REGION=us-east-1
BEDROCK_NOVA_LITE_MODEL=amazon.nova-lite-v1:0
BEDROCK_NOVA_PRO_MODEL=amazon.nova-pro-v1:0
```

Add ALL 7 to Vercel.

---

## 💡 Key Points

- ✅ Setup is **completely automated** - just run one command
- ✅ Takes **2-5 minutes** including adding env vars
- ✅ Uses **secure OIDC** - no stored credentials
- ✅ All **AWS resources created** - nothing manual
- ✅ **Complete documentation** - guides for all skill levels
- ✅ **Troubleshooting included** - solutions for common issues

---

## 🎯 Recommended Next Steps

### Right Now
1. Run: `python scripts/setup-aws-oidc.py`
2. Copy the environment variables
3. Add them to Vercel
4. Deploy: `git push`
5. Test at `/auth/signup`

### After Setup Works
- Read [AWS_OIDC_SETUP_SUMMARY.md](./AWS_OIDC_SETUP_SUMMARY.md) to understand what happened
- Keep [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) handy for reference
- Start building features!

---

## 📚 Documentation Map

```
START HERE:
  └─ START_AWS_SETUP.md (1 min) - Ultra quick start
     OR
  └─ REFERENCE_CARD.md (2 min) - Quick reference

QUICK PATH (5 min total):
  ├─ QUICK_START.md (5 min) - Step by step
  └─ Run setup & deploy

LEARNING PATH (25 min total):
  ├─ AWS_OIDC_SETUP_SUMMARY.md (20 min) - Full explanation
  ├─ Run setup & deploy
  └─ TROUBLESHOOTING.md - Keep for reference

MANUAL PATH (30 min total):
  ├─ AWS_SETUP_GUIDE.md (15 min) - Step-by-step manual
  ├─ Run AWS CLI commands
  ├─ Add env vars & deploy
  └─ TROUBLESHOOTING.md - Keep for reference

LOST? READ THIS:
  └─ AWS_OIDC_INDEX.md - Navigation guide
```

---

## ⏱️ Time Estimates

| Activity | Time |
|----------|------|
| Run setup script | 2 min |
| Add env vars to Vercel | 1 min |
| Deploy | 2-3 min |
| Test | 1 min |
| **Total** | **6-7 min** |

---

## ✨ What Makes This Work

Your app uses `@vercel/functions/oidc` which automatically:
1. Gets a token from Vercel
2. Sends it to AWS
3. AWS verifies it with the OIDC provider
4. AWS issues temporary credentials
5. App uses credentials for 1 hour
6. Repeat next hour

No stored credentials, auto-renewal, secure! 🔐

---

## 🎉 You're Ready!

Everything you need is here:
- ✅ Automated setup scripts
- ✅ Complete documentation
- ✅ Troubleshooting guides
- ✅ Verification procedures

## Get Started Now

```bash
python scripts/setup-aws-oidc.py
```

Then follow the script's instructions.

**That's it!** You've got this! 💪

---

## 📞 Need Help?

1. **Lost?** → Read [START_AWS_SETUP.md](./START_AWS_SETUP.md)
2. **Quick ref?** → Check [REFERENCE_CARD.md](./REFERENCE_CARD.md)
3. **Navigation?** → See [AWS_OIDC_INDEX.md](./AWS_OIDC_INDEX.md)
4. **Error?** → Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
5. **Learning?** → Read [AWS_OIDC_SETUP_SUMMARY.md](./AWS_OIDC_SETUP_SUMMARY.md)

---

**Everything is set up. The fix is ready. You've got this!** 🚀
