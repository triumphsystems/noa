# Noa Platform - Deployment Guide

## Pre-Deployment Checklist

### AWS Account Setup
- [ ] AWS Account created
- [ ] IAM role configured with proper permissions
- [ ] DynamoDB table created
- [ ] S3 bucket configured
- [ ] Bedrock models enabled
- [ ] VPC and security groups configured
- [ ] CloudTrail enabled for auditing

### Application Configuration
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] API endpoints tested locally
- [ ] WebSocket connections verified
- [ ] Error handling tested
- [ ] Logging configured
- [ ] Monitoring alerts set up

### Security Review
- [ ] HIPAA compliance verified
- [ ] Encryption enabled (data at rest and in transit)
- [ ] Access controls configured
- [ ] API authentication tested
- [ ] Input validation verified
- [ ] Rate limiting implemented
- [ ] CORS properly configured

## Local Development Setup

### Prerequisites
```bash
# Node.js 18+
node --version

# pnpm (already installed)
pnpm --version

# AWS CLI
aws --version

# Git
git --version
```

### Installation

```bash
# Clone repository
git clone <repo-url>
cd noa-platform

# Install dependencies
pnpm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local with your AWS credentials
nano .env.local
```

### Environment Variables

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=noa-medical-dev

# DynamoDB
DYNAMODB_TABLE_NAME=noa-db
DYNAMODB_TABLE_PARTITION_KEY=id

# Application
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: Cognito
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=
NEXT_PUBLIC_COGNITO_CLIENT_ID=
```

### Development Server

```bash
# Start development server
pnpm dev

# Server runs on http://localhost:3000

# In another terminal, watch for changes
pnpm type-check

# Run linting
pnpm lint
```

## Testing

### Unit Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test api/clinical/soap
```

### Integration Tests
```bash
# Test AWS integrations
pnpm test:aws

# Test DynamoDB queries
pnpm test:dynamodb

# Test Bedrock API calls
pnpm test:bedrock
```

### End-to-End Tests
```bash
# Run E2E tests
pnpm test:e2e

# Run specific E2E test
pnpm test:e2e dashboard
```

## Build and Deployment

### Production Build

```bash
# Build the application
pnpm build

# Verify build completed successfully
ls -la .next/

# Test production build locally
pnpm start
```

### Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Configure environment variables in Vercel dashboard
# Settings → Environment Variables

# Trigger redeployment after setting env vars
vercel --prod
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN pnpm install

# Build application
COPY . .
RUN pnpm build

# Expose port
EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
```

```bash
# Build Docker image
docker build -t noa-platform:latest .

# Run Docker container
docker run -p 3000:3000 \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  noa-platform:latest
```

### AWS Lambda Deployment

```bash
# Package application
pnpm build
zip -r lambda-deployment.zip .next node_modules

# Deploy to Lambda
aws lambda update-function-code \
  --function-name noa-api \
  --zip-file fileb://lambda-deployment.zip
```

## Database Initialization

### Create DynamoDB Table

```bash
# Using AWS CLI
aws dynamodb create-table \
  --table-name noa-data \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=type,AttributeType=S \
    AttributeName=email,AttributeType=S \
    AttributeName=doctorId,AttributeType=S \
    AttributeName=patientId,AttributeType=S \
    AttributeName=createdAt,AttributeType=N \
  --key-schema \
    AttributeName=id,KeyType=HASH \
    AttributeName=type,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Create Global Secondary Indexes
aws dynamodb update-table \
  --table-name noa-data \
  --attribute-definitions \
    AttributeName=email,AttributeType=S \
  --global-secondary-index-updates \
    '[{
      "Create": {
        "IndexName": "email-index",
        "KeySchema": [
          {"AttributeName": "email", "KeyType": "HASH"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
      }
    }]'
```

### Seed Initial Data

```bash
# Run seeding script
pnpm seed:db

# Verify data was created
aws dynamodb scan --table-name noa-data --limit 5
```

## Monitoring and Logging

### CloudWatch Setup

```bash
# Create log group
aws logs create-log-group --log-group-name /aws/noa/api

# Set retention policy
aws logs put-retention-policy \
  --log-group-name /aws/noa/api \
  --retention-in-days 30
```

### Application Logging

```typescript
// lib/logger.ts
import { CloudWatchTransport } from 'aws-lambda-powertools-logger'

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'noa-api',
})

// Use throughout app
logger.info('Session created', { sessionId, doctorId })
logger.error('Failed to generate SOAP', { error, sessionId })
```

### Monitoring Dashboards

```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name noa-platform \
  --dashboard-body file://dashboard-config.json
```

### Set Up Alarms

```bash
# Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name noa-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold

# DynamoDB throttling
aws cloudwatch put-metric-alarm \
  --alarm-name noa-dynamodb-throttle \
  --metric-name UserErrors \
  --namespace AWS/DynamoDB \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold
```

## Performance Optimization

### Database Optimization

```typescript
// lib/db.ts - Add batch operations
export async function batchCreateSessions(sessions: SessionData[]) {
  const docClient = getDynamoDBClient()
  
  const params = {
    RequestItems: {
      'noa-data': sessions.map(session => ({
        PutRequest: {
          Item: session
        }
      }))
    }
  }
  
  return docClient.batchWriteItem(params)
}
```

### Caching Strategy

```typescript
// lib/cache.ts
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 600 })

export function getCachedPatients(doctorId: string) {
  const cacheKey = `patients-${doctorId}`
  const cached = cache.get(cacheKey)
  
  if (cached) return cached
  
  const patients = queryPatientsFromDB(doctorId)
  cache.set(cacheKey, patients)
  return patients
}
```

### API Rate Limiting

```typescript
// lib/rate-limiter.ts
import Bottleneck from 'bottleneck'

const limiter = new Bottleneck({
  minTime: 100, // minimum time between requests
  maxConcurrent: 10 // maximum concurrent requests
})

export async function limitedBedrockCall(params) {
  return limiter.schedule(() => bedrockClient.invoke(params))
}
```

## Scaling Considerations

### For 1,000 Users
- DynamoDB: On-demand billing
- Lambda: Concurrent execution limit: 1,000
- S3: No changes needed
- WebSocket: Use Elasticache for session storage

### For 10,000 Users
- DynamoDB: Provisioned capacity with autoscaling
- Lambda: Increase concurrency limit
- S3: Enable CloudFront CDN
- WebSocket: Use managed WebSocket service (API Gateway)
- Add: Redis for caching and sessions

### For 100,000+ Users
- DynamoDB: Global tables for multi-region
- Lambda: Use containers for better control
- S3: Enable transfer acceleration
- WebSocket: Managed service with load balancing
- Add: CDN for static assets
- Add: Queue system (SQS) for async processing
- Add: Cache layer (ElastiCache)

## Disaster Recovery

### Backup Strategy

```bash
# Enable DynamoDB point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name noa-data \
  --point-in-time-recovery-specification \
  PointInTimeRecoveryEnabled=true

# Create on-demand backup
aws dynamodb create-backup \
  --table-name noa-data \
  --backup-name noa-backup-$(date +%Y%m%d)
```

### Restore Procedure

```bash
# List available backups
aws dynamodb list-backups --table-name noa-data

# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name noa-data-restored \
  --backup-arn <backup-arn>
```

## Rollback Procedure

```bash
# If deployment fails, use previous version
vercel rollback

# Or manually revert to previous deployment
vercel deploy --prod --with-cache false
```

## Post-Deployment Verification

### Health Checks

```bash
# Check application health
curl http://your-domain.com/health

# Verify API endpoints
curl http://your-domain.com/api/patients

# Test WebSocket connection
wscat -c wss://your-domain.com/ws
```

### Performance Testing

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 http://your-domain.com/api/sessions

# Using Artillery
artillery quick --count 100 --num 1000 http://your-domain.com
```

### Smoke Tests

```bash
# Run critical path tests
pnpm test:smoke

# Verify:
# - Doctor can login
# - Doctor can start session
# - SOAP note generates
# - Patient can view summary
```

## Support and Troubleshooting

### Common Issues

**Issue**: "NoCredentialsError" from AWS
```
Solution: Verify AWS credentials and AWS_REGION in .env
Check IAM role has proper permissions
Restart application after env changes
```

**Issue**: "ValidationException" from Bedrock
```
Solution: Verify model ID is correct
Check token limits not exceeded
Ensure model access is enabled
```

**Issue**: WebSocket connection failures
```
Solution: Check CORS configuration
Verify WebSocket server is running
Check firewall allows WebSocket traffic
```

### Getting Help

- Check CloudWatch logs for errors
- Review application logs in `/var/log/noa/`
- Enable debug logging: `DEBUG=noa:* pnpm dev`
- Check AWS service health dashboard
- Contact AWS support for infrastructure issues

---

**Deployment Success Criteria**:
- ✅ All health checks pass
- ✅ API endpoints respond correctly
- ✅ Database queries work
- ✅ WebSocket connections established
- ✅ AI models respond
- ✅ Logs are being collected
- ✅ Monitoring alerts are active
- ✅ Backups are scheduled
