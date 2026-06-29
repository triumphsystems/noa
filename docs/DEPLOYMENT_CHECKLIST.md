# Complete Deployment Checklist

Comprehensive checklist for deploying Noa with Terraform infrastructure and Vercel management.

## Phase 1: Preparation (Days 1-2)

### Planning & Requirements
- [ ] Review all documentation
  - [ ] README.md - Overview
  - [ ] Terraform/README.md - Infrastructure docs
  - [ ] TERRAFORM_EXECUTION_GUIDE.md - Step-by-step
  - [ ] INFRASTRUCTURE_CONFIG_GUIDE.md - Configuration
- [ ] Gather requirements
  - [ ] AWS Account ID
  - [ ] Domain name for application
  - [ ] Email for alerts
  - [ ] Backup strategy
  - [ ] Monitoring needs
- [ ] Security planning
  - [ ] Review IAM policies
  - [ ] Plan encryption strategy
  - [ ] Document access control
  - [ ] Plan incident response

### AWS Account Setup
- [ ] Create AWS account (if new)
- [ ] Enable Bedrock service
  ```bash
  aws bedrock list-foundation-models --region us-east-1
  ```
- [ ] Enable required regions
  - [ ] us-east-1 (primary)
  - [ ] us-west-2 (backup, if using replication)
- [ ] Create IAM user for deployment
  - [ ] Attach necessary policies
  - [ ] Create access keys
- [ ] Test AWS CLI access
  ```bash
  aws sts get-caller-identity
  ```

### Local Environment Setup
- [ ] Install required tools
  - [ ] Terraform >= 1.0
  - [ ] AWS CLI v2
  - [ ] Node.js 18+
  - [ ] pnpm 8+
  - [ ] Git
- [ ] Clone repository
  ```bash
  git clone <repo-url>
  cd noa
  ```
- [ ] Install dependencies
  ```bash
  pnpm install
  ```
- [ ] Configure AWS credentials
  ```bash
  aws configure
  ```

## Phase 2: Infrastructure (Days 3-5)

### Terraform Preparation
- [ ] Navigate to terraform directory
  ```bash
  cd terraform
  ```
- [ ] Initialize Terraform
  ```bash
  terraform init
  ```
- [ ] Create variables file
  ```bash
  cp terraform.tfvars.example terraform.tfvars
  ```
- [ ] Update terraform.tfvars with:
  - [ ] `aws_account_id` - From `aws sts get-caller-identity`
  - [ ] `aws_region` - Desired region
  - [ ] `environment` - prod/staging/dev
  - [ ] `app_url` - Your domain
  - [ ] Optional: Enable backups, monitoring

### Terraform Planning
- [ ] Validate configuration
  ```bash
  terraform validate
  ```
- [ ] Format code
  ```bash
  terraform fmt -recursive
  ```
- [ ] Generate plan
  ```bash
  terraform plan -out=tfplan
  ```
- [ ] Review plan output
  - [ ] Check resource count
  - [ ] Verify S3 bucket names
  - [ ] Confirm IAM roles
  - [ ] Review CloudWatch settings
- [ ] Resolve any issues
  - [ ] Check for warnings
  - [ ] Verify variable values

### Terraform Deployment
- [ ] Pre-deployment checks
  ```bash
  aws bedrock list-foundation-models --region us-east-1
  aws s3 ls  # Test S3 permissions
  ```
- [ ] Apply Terraform
  ```bash
  terraform apply tfplan
  ```
- [ ] Monitor execution (5-10 minutes)
  - [ ] S3 buckets created
  - [ ] IAM roles created
  - [ ] CloudWatch logs created
  - [ ] All resources successful
- [ ] Verify completion
  ```bash
  terraform output
  ```
- [ ] Save outputs
  ```bash
  terraform output -json > outputs.json
  ```

### Infrastructure Verification
- [ ] Check S3 buckets
  ```bash
  aws s3 ls | grep noa-audio
  ```
- [ ] Verify IAM roles
  ```bash
  aws iam list-roles | grep noa
  ```
- [ ] Verify CloudWatch
  ```bash
  aws logs describe-log-groups --log-group-name-prefix "/aws/noa"
  ```
- [ ] Test Bedrock access
  ```bash
  aws bedrock-runtime invoke-model \
    --model-id us.anthropic.claude-3-5-sonnet-20241022 \
    --body '{"messages":[{"role":"user","content":"test"}]}'
  ```

## Phase 3: Environment Configuration (Days 5-6)

### Local Development Setup
- [ ] Create `.env.local`
  ```bash
  cp .env.example .env.local
  ```
- [ ] Fill from terraform outputs
  ```bash
  cat terraform-outputs.json | jq '.environment_variables.value'
  ```
- [ ] Add to `.env.local`:
  - [ ] `AWS_REGION`
  - [ ] `AWS_ACCOUNT_ID`
  - [ ] `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
  - [ ] `DYNAMODB_TABLE_NAME`
  - [ ] `S3_BUCKET`
  - [ ] `S3_BACKUP_BUCKET`
  - [ ] All Bedrock model IDs
- [ ] Verify variables
  ```bash
  source .env.local
  echo $AWS_ACCESS_KEY_ID
  echo $S3_BUCKET
  ```

### Local Testing
- [ ] Start development server
  ```bash
  pnpm dev
  ```
- [ ] Wait for startup
  - [ ] No errors in terminal
  - [ ] Server listening on http://localhost:3000
- [ ] Test API endpoints
  - [ ] Health check
    ```bash
    curl http://localhost:3000/api/health
    ```
  - [ ] DynamoDB
    ```bash
    curl http://localhost:3000/api/patients?doctorId=test
    ```
  - [ ] S3 (if applicable)
  - [ ] Bedrock
    ```bash
    curl -X POST http://localhost:3000/api/clinical/soap \
      -H "Content-Type: application/json" \
      -d '{"transcript":"test","sessionId":"s1"}'
    ```
- [ ] Verify functionality
  - [ ] Login/signup works
  - [ ] Patient creation works
  - [ ] Session creation works
  - [ ] SOAP note generation works

### Vercel Project Setup
- [ ] Create Vercel account (if needed)
- [ ] Create new project
  - [ ] Via vercel.com dashboard
  - [ ] Or: `vercel`
- [ ] Connect GitHub repository
  - [ ] Select organization
  - [ ] Select repository
  - [ ] Authorize Vercel
- [ ] Configure build settings
  - [ ] Framework: Next.js
  - [ ] Build command: `pnpm build`
  - [ ] Output directory: `.next`

### Vercel Environment Variables
- [ ] Go to Vercel Project Settings
- [ ] Select "Environment Variables"
- [ ] Add for Production environment:
  - [ ] `AWS_REGION` = terraform output
  - [ ] `AWS_ACCOUNT_ID` = terraform output
  - [ ] `S3_BUCKET` = terraform output
  - [ ] `S3_BACKUP_BUCKET` = terraform output
  - [ ] `CLOUDWATCH_LOG_GROUP` = terraform output
  - [ ] `DYNAMODB_TABLE_NAME` = terraform output
  - [ ] `DYNAMODB_TABLE_PARTITION_KEY` = `id`
  - [ ] All `BEDROCK_*` variables
  - [ ] `NODE_ENV` = production
  - [ ] `NEXT_PUBLIC_APP_URL` = your domain
- [ ] Add for Preview environment:
  - [ ] Same variables, with staging values
- [ ] Add for Development environment:
  - [ ] Same variables, with dev values

### DynamoDB Verification
- [ ] Confirm Terraform created the table
- [ ] Verify the three indexes exist
- [ ] Check the table name matches `DYNAMODB_TABLE_NAME`
- [ ] Test connection from a deployed preview or local environment

## Phase 4: Deployment (Days 6-7)

### Pre-Deployment Final Checks
- [ ] All environment variables verified
- [ ] Local testing passed
- [ ] Infrastructure confirmed
- [ ] Bedrock access confirmed
- [ ] S3 access confirmed
- [ ] DynamoDB integration active
- [ ] GitHub connected to Vercel
- [ ] Domain configured (if applicable)

### Deploy to Vercel
- [ ] Commit changes
  ```bash
  git add .
  git commit -m "Deploy: Configure infrastructure for production"
  ```
- [ ] Push to main
  ```bash
  git push origin main
  ```
- [ ] Vercel auto-deploys
  - [ ] Monitor: vercel.com/dashboard
  - [ ] Check deployment logs
  - [ ] Wait for "Ready" status
- [ ] Deployment should take 2-5 minutes

### Post-Deployment Verification
- [ ] Check Vercel deployment status
  - [ ] All checks passing
  - [ ] No build errors
  - [ ] All environment variables loaded
- [ ] Test production API
  ```bash
  curl https://your-deployment.vercel.app/api/health
  ```
- [ ] Test database connectivity
  ```bash
  curl https://your-deployment.vercel.app/api/patients
  ```
- [ ] Test Bedrock integration
  ```bash
  curl -X POST https://your-deployment.vercel.app/api/clinical/soap \
    -H "Content-Type: application/json" \
    -d '{"transcript":"test","sessionId":"s1"}'
  ```
- [ ] Test S3 integration (if applicable)
- [ ] Browser testing
  - [ ] Visit application URL
  - [ ] Test login
  - [ ] Navigate dashboard
  - [ ] Test file uploads (if applicable)

### Monitoring Setup
- [ ] CloudWatch Dashboards
  - [ ] Create custom dashboard
  - [ ] Add key metrics
- [ ] CloudWatch Alarms
  - [ ] Set up error alerts
  - [ ] Set up performance alerts
  - [ ] Configure SNS notifications
- [ ] Error Tracking
  - [ ] Set up Sentry (optional)
  - [ ] Configure error notifications
- [ ] Performance Monitoring
  - [ ] Enable Vercel Analytics
  - [ ] Review Web Vitals
  - [ ] Set performance budgets

## Phase 5: Post-Deployment (Days 8+)

### Verification & Testing
- [ ] Smoke tests pass
- [ ] All core features functional
- [ ] API endpoints responding correctly
- [ ] Database operations working
- [ ] File uploads/downloads working (if applicable)
- [ ] Email notifications working (if configured)

### Security Hardening
- [ ] Review security groups
- [ ] Verify IAM least-privilege
- [ ] Enable S3 versioning (done by Terraform)
- [ ] Enable S3 encryption (done by Terraform)
- [ ] Review CloudWatch logs for issues
- [ ] Check for unauthorized access attempts
- [ ] Verify CORS configuration

### Backup & Recovery
- [ ] Verify S3 versioning enabled
- [ ] Test S3 backup restoration
- [ ] Verify DynamoDB backups (if enabled)
- [ ] Document recovery procedures
- [ ] Test recovery process
- [ ] Set up automated backups (if not using S3 replication)

### Documentation Updates
- [ ] Update runbooks
- [ ] Document deployment procedures
- [ ] Document troubleshooting steps
- [ ] Document rollback procedures
- [ ] Create architecture diagrams
- [ ] Document key resource IDs
- [ ] Document passwords/secrets (in secure location)

### Team Handoff
- [ ] Train operations team
- [ ] Train support team
- [ ] Provide access credentials
- [ ] Set up communication channels
- [ ] Create on-call schedule
- [ ] Document escalation procedures

### Cost Optimization
- [ ] Review AWS costs
- [ ] Optimize resource sizing
- [ ] Review CloudWatch retention
- [ ] Review S3 lifecycle policies
- [ ] Monitor for cost anomalies

## Rollback Plan

If deployment fails:

### Step 1: Identify Issue
```bash
# Check Vercel logs
vercel logs

# Check CloudWatch logs
aws logs tail /aws/noa/prod --follow

# Check application errors
# Review browser console errors
```

### Step 2: Rollback Application
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or deploy from previous Vercel deployment
# Via Vercel dashboard: Deployments → Select previous → Promote
```

### Step 3: Rollback Infrastructure (if needed)
```bash
cd terraform
terraform destroy -target=resource_name
terraform apply
```

### Step 4: Verify Rollback
- [ ] Application accessible
- [ ] APIs responding
- [ ] Databases connected
- [ ] All checks passing

## Success Criteria

Application is production-ready when:

- [ ] ✅ All infrastructure resources created
- [ ] ✅ All environment variables configured
- [ ] ✅ Application deploys without errors
- [ ] ✅ All API endpoints respond correctly
- [ ] ✅ Database connectivity verified
- [ ] ✅ Bedrock models accessible
- [ ] ✅ S3 storage functional
- [ ] ✅ CloudWatch logging active
- [ ] ✅ Security verified
- [ ] ✅ Performance acceptable
- [ ] ✅ User authentication working
- [ ] ✅ All core features functional
- [ ] ✅ Monitoring and alerting active
- [ ] ✅ Backup strategy in place
- [ ] ✅ Documentation complete

## Go-Live Announcement

Once all checks pass:

```
🚀 NOA IS NOW LIVE! 🚀

Infrastructure: ✅ AWS (Terraform-provisioned)
Database: ✅ DynamoDB (Terraform-provisioned)
Application: ✅ Deployed to Vercel
Monitoring: ✅ CloudWatch active

Ready for production use!
```

## Post-Launch Support

### Week 1: Close Monitoring
- [ ] Monitor application 24/7
- [ ] Check metrics hourly
- [ ] Be ready for quick fixes
- [ ] Have team on standby

### Week 2-4: Regular Monitoring
- [ ] Check metrics daily
- [ ] Review error logs
- [ ] Monitor performance
- [ ] Plan optimizations

### Month 2+: Standard Operations
- [ ] Weekly reviews
- [ ] Monthly cost optimization
- [ ] Quarterly security reviews
- [ ] Ongoing improvements

## Contacts & Escalation

### Primary Contacts
- **Infrastructure**: [Team Lead]
- **Application**: [Dev Lead]
- **Security**: [Security Officer]
- **Operations**: [Ops Manager]

### Escalation Path
1. First Level: On-call engineer
2. Second Level: Team lead
3. Third Level: Director/Manager

### Emergency Contacts
- AWS Support: [Support ID]
- Vercel Support: [Support ID]
- On-call: [Contact Info]

---

**Deployment Status: Ready for Production** ✅

All systems go!
