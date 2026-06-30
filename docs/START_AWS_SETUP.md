# 🚀 START HERE - AWS OIDC Setup

## Your Error

```
InvalidIdentityToken: No OpenIDConnect provider found in your account 
for https://oidc.vercel.com/leoemaxie
```

## The One-Command Fix

```bash
python scripts/setup-aws-oidc.py
```

That's it! This command will:
- ✅ Create OIDC provider in AWS
- ✅ Create IAM role with permissions
- ✅ Create DynamoDB table
- ✅ Print environment variables to add to Vercel
- ✅ Tell you exactly what to do next

**Time:** 2-5 minutes total

---

## What to Do After Running the Command

### 1. Copy the Environment Variables
The script prints 7 variables. Save them.

### 2. Add to Vercel
- Go to: https://vercel.com/leoemaxie/noa
- Settings → Environment Variables
- Add each variable
- Redeploy

### 3. Test
- Visit `/auth/signup`
- Should work now!

---

## Need Help?

- **Quick reference:** [REFERENCE_CARD.md](./REFERENCE_CARD.md)
- **Step-by-step:** [QUICK_START.md](./QUICK_START.md)
- **Full explanation:** [AWS_OIDC_SETUP_SUMMARY.md](./AWS_OIDC_SETUP_SUMMARY.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Navigation:** [AWS_OIDC_INDEX.md](./AWS_OIDC_INDEX.md)

---

## Go!

```bash
python scripts/setup-aws-oidc.py
```

Then follow the script's instructions. You've got this! 💪
