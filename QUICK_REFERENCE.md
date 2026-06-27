# Noa Platform - Quick Reference Guide

## 🚀 Quick Start (5 minutes)

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with AWS credentials

# 3. Start dev server
pnpm dev

# 4. Open browser
# Visit http://localhost:3000
```

## 📂 Project Structure

```
noa-platform/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Auth pages (signup, login)
│   ├── dashboard/                # Doctor dashboard
│   ├── patient-intake/           # Patient registration
│   ├── patient-dashboard/        # Patient portal
│   └── api/                      # API routes
│       ├── auth/                 # Authentication
│       ├── patients/             # Patient CRUD
│       ├── sessions/             # Session management
│       └── clinical/             # AI endpoints
├── lib/
│   ├── bedrock-nova.ts           # Nova AI models
│   ├── voice-service.ts          # Sonic AI + voice
│   ├── websocket-service.ts      # Real-time comms
│   ├── db.ts                     # DynamoDB client
│   └── stores/                   # Zustand stores
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── dashboard/                # Dashboard UI
│   └── common/                   # Shared components
└── public/                       # Static assets
```

## 🔑 Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| AWS_REGION | AWS region | us-east-1 |
| AWS_ROLE_ARN | IAM role | arn:aws:iam::123:role/noa |
| AWS_S3_BUCKET | S3 bucket | noa-medical |
| DYNAMODB_TABLE_NAME | DB table | noa-data |
| NEXT_PUBLIC_API_URL | API URL | http://localhost:3000 |

## 🎨 Design System (Ditto)

### Colors
```css
--primary: #ffe228    /* Hi Yellow */
--dark: #130e30       /* Deep Ink */
--success: #59e25d    /* Moss Green */
--accent: #e261e5     /* Fuchsia */
--muted: #5f5c6e      /* Slate */
--bg: #f9fbf2         /* Canvas */
--bg-secondary: #eff2e5 /* Soft Meadow */
```

### Fonts
```css
font-family: 'Hedvig Letters Serif'  /* Headings */
font-family: 'Inter'                 /* Body & UI */
```

### Components
```tsx
// Button (pill-shaped)
<Button className="rounded-full bg-hi-yellow text-deep-ink px-8 py-3">
  Click Me
</Button>

// Card (rounded corners)
<div className="bg-white rounded-3xl p-6 border border-deep-ink/10">
  Content
</div>

// Responsive text
<h1 className="text-3xl md:text-5xl font-serif font-bold text-deep-ink">
  Heading
</h1>
```

## 🗄️ Database (DynamoDB)

### Create Item
```typescript
import { getDynamoDBClient } from '@/lib/db'

const docClient = getDynamoDBClient()
await docClient.put({
  TableName: 'noa-data',
  Item: {
    id: 'patient-123',
    type: 'patient',
    firstName: 'John',
    createdAt: Date.now(),
  }
})
```

### Query Items
```typescript
const result = await docClient.query({
  TableName: 'noa-data',
  IndexName: 'doctorId-index',
  KeyConditionExpression: 'doctorId = :doctorId',
  ExpressionAttributeValues: {
    ':doctorId': 'doctor-456'
  }
})
```

### Update Item
```typescript
await docClient.update({
  TableName: 'noa-data',
  Key: { id: 'patient-123', type: 'patient' },
  UpdateExpression: 'SET #name = :name, updatedAt = :now',
  ExpressionAttributeNames: { '#name': 'firstName' },
  ExpressionAttributeValues: {
    ':name': 'Jane',
    ':now': Date.now()
  }
})
```

## 🤖 AI Models (Bedrock)

### Generate SOAP Note (Nova Lite)
```typescript
import { generateSOAPWithNova } from '@/lib/bedrock-nova'

const soapNote = await generateSOAPWithNova(
  transcript, 
  patientContext
)
// Returns: { subjective, objective, assessment, plan }
```

### Get Clinical Insights (Nova Pro)
```typescript
import { generateClinicalInsights } from '@/lib/bedrock-nova'

const insights = await generateClinicalInsights(
  patientHistory,
  currentPresentation,
  previousFindings
)
```

### Get Real-Time Suggestions (Nova Sonic)
```typescript
import { getClinicaSuggestions } from '@/lib/voice-service'

const suggestions = await getClinicaSuggestions(
  transcript,
  patientHistory,
  currentSymptoms
)
```

### Generate Triage Priority
```typescript
import { generateTriagePriority } from '@/lib/bedrock-nova'

const triage = await generateTriagePriority(
  chiefComplaint,
  symptoms,
  vitalSigns
)
// Returns: { priority, reason, recommendations }
```

## 🔌 WebSocket Events

### Client Events (Send)
```typescript
socket.emit('join-session', { sessionId, userId, userType })
socket.emit('transcript-update', { sessionId, text })
socket.emit('audio-chunk', { sessionId, chunk, timestamp })
socket.emit('get-suggestion', { sessionId, transcript })
socket.emit('start-recording', { sessionId })
socket.emit('stop-recording', { sessionId })
socket.emit('end-session', { sessionId })
```

### Server Events (Receive)
```typescript
socket.on('session-joined', (data) => { /* ... */ })
socket.on('transcript-updated', (data) => { /* ... */ })
socket.on('audio-received', (data) => { /* ... */ })
socket.on('suggestion-generated', (data) => { /* ... */ })
socket.on('recording-started', (data) => { /* ... */ })
socket.on('recording-stopped', (data) => { /* ... */ })
socket.on('session-ending', (data) => { /* ... */ })
```

## 📡 API Endpoints

### Authentication
```
POST /api/auth/signup
POST /api/auth/login
```

### Patients
```
GET /api/patients?doctorId={id}
POST /api/patients
GET /api/patients/{id}
```

### Sessions
```
GET /api/sessions?doctorId={id}
POST /api/sessions
POST /api/sessions/voice
GET /api/sessions/{id}
```

### Clinical AI
```
POST /api/clinical/soap
POST /api/clinical/insights
POST /api/clinical/suggestions
POST /api/clinical/triage
POST /api/clinical/patient-summary
```

### Intakes
```
POST /api/intakes
GET /api/intakes?patientId={id}
```

## 🎯 State Management (Zustand)

### Session Store
```typescript
import { useSessionStore } from '@/lib/stores/session-store'

// In component
const { sessionId, messages, addMessage, setStatus } = useSessionStore()

// Initialize session
useSessionStore.setState(state => ({
  ...state.initializeSession(doctorId, patientId, patientName)
}))

// Add message
addMessage({
  role: 'doctor',
  text: 'Hello patient',
  timestamp: Date.now()
})
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test
pnpm test api/clinical/soap

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 🔍 Debugging

```bash
// Add debug logs
console.log('[v0] Debug message:', variable)

// Enable verbose logging
DEBUG=noa:* pnpm dev

// Browser DevTools
// Press F12 to open developer console
// Check Network tab for API calls
// Check Application tab for localStorage
```

## 📊 Data Models

### Doctor
```typescript
{
  id: 'doctor-uuid',
  type: 'doctor',
  email: 'doctor@hospital.com',
  firstName: 'John',
  lastName: 'Smith',
  specialty: 'Cardiology',
  clinic: 'City Hospital',
  createdAt: 1719432000000
}
```

### Patient
```typescript
{
  id: 'patient-uuid',
  type: 'patient',
  doctorId: 'doctor-uuid',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'patient@email.com',
  conditions: ['Hypertension'],
  medications: ['Lisinopril'],
  createdAt: 1719432000000
}
```

### Session
```typescript
{
  id: 'session-uuid',
  type: 'session',
  doctorId: 'doctor-uuid',
  patientId: 'patient-uuid',
  transcript: 'Full conversation...',
  soapNote: { subjective, objective, assessment, plan },
  status: 'completed',
  createdAt: 1719432000000
}
```

## ⚡ Performance Tips

1. **Batch DynamoDB operations** - Use batch writes for multiple items
2. **Cache frequently accessed data** - Use Zustand or SWR
3. **Limit AI model calls** - Batch suggestions, debounce requests
4. **Optimize images** - Use Next.js Image component
5. **Monitor CloudWatch** - Set up alerts for errors

## 🐛 Common Errors

### "InvalidSignatureException"
```
→ Check AWS credentials in .env
→ Verify AWS_ROLE_ARN is correct
→ Ensure role has DynamoDB/Bedrock permissions
```

### "ValidationException" from Bedrock
```
→ Check token limit (Nova Lite: 2000, Nova Pro: 4096)
→ Verify model access is enabled
→ Check input format matches expected schema
```

### "Item size has exceeded the maximum allowed size"
```
→ DynamoDB items have 400KB limit
→ Move large data (audio) to S3
→ Store S3 URL in DynamoDB item
```

### WebSocket connection refused
```
→ Verify Socket.io server running
→ Check CORS settings
→ Ensure WebSocket port is open
```

## 🚢 Deployment Checklist

- [ ] Build succeeds: `pnpm build`
- [ ] No TypeScript errors: `pnpm type-check`
- [ ] Tests pass: `pnpm test`
- [ ] Linting passes: `pnpm lint`
- [ ] Environment variables set in Vercel
- [ ] Database migrated
- [ ] Bedrock models enabled
- [ ] S3 bucket configured
- [ ] Monitoring set up
- [ ] Backups enabled

## 📚 Resources

- [AWS Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [DynamoDB Guide](https://docs.aws.amazon.com/dynamodb/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.io Guide](https://socket.io/docs/)
- [Zustand Store](https://github.com/pmndrs/zustand)

---

**Need Help?**
- Check FEATURES_IMPLEMENTED.md for complete feature list
- See AWS_INTEGRATION_GUIDE.md for AWS setup
- Read DEPLOYMENT_GUIDE.md for production deployment
