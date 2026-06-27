# Noa Platform - DynamoDB Integration Guide

## Overview

The Noa medical intelligence platform is now fully integrated with AWS DynamoDB. All data including doctors, patients, sessions, and patient intakes are persisted in DynamoDB using real queries and IAM authentication.

## Database Schema

The application uses a single DynamoDB table with multiple secondary indexes for efficient querying:

### Main Table: `noa-data`

**Partition Key:** `id` (String)
**Sort Key:** `type` (String) - Used to distinguish between different entity types

#### Entity Types:

1. **Doctor** (`type: 'doctor'`)
   - `id`: Unique doctor identifier (format: `doctor-{nanoid}`)
   - `email`: Doctor's email (indexed via `email-index`)
   - `name`: Full name
   - `specialty`: Medical specialty
   - `clinic`: Clinic/organization name
   - `license`: Medical license number
   - `phone`: Contact phone
   - `avatar`: Profile image URL
   - `createdAt`: Timestamp
   - `updatedAt`: Timestamp

2. **Patient** (`type: 'patient'`)
   - `id`: Unique patient identifier (format: `patient-{nanoid}`)
   - `doctorId`: Associated doctor ID (indexed via `doctorId-index`)
   - `email`: Patient email
   - `firstName`: First name
   - `lastName`: Last name
   - `dateOfBirth`: DOB
   - `gender`: Gender
   - `phone`: Contact phone
   - `address`: Physical address
   - `allergies`: Array of allergies
   - `medications`: Current medications
   - `conditions`: Medical conditions
   - `avatar`: Profile image URL
   - `createdAt`: Timestamp
   - `updatedAt`: Timestamp

3. **Session** (`type: 'session'`)
   - `id`: Unique session identifier (format: `session-{nanoid}`)
   - `doctorId`: Associated doctor ID (indexed via `doctorId-index`)
   - `patientId`: Associated patient ID (indexed via `patientId-index`)
   - `startedAt`: Session start timestamp
   - `endedAt`: Session end timestamp (optional)
   - `transcript`: Voice/conversation transcript
   - `audioUrl`: S3 URL to audio file
   - `status`: `active`, `completed`, or `archived`
   - `soapNote`: Nested SOAP note object with subjective, objective, assessment, plan
   - `createdAt`: Timestamp
   - `updatedAt`: Timestamp

4. **PatientIntake** (`type: 'intake'`)
   - `id`: Unique intake identifier (format: `intake-{nanoid}`)
   - `patientId`: Associated patient ID (indexed via `patientId-index`)
   - `doctorId`: Associated doctor ID
   - `medicalHistory`: Medical history text
   - `medications`: Array of current medications
   - `allergies`: Array of allergies
   - `surgeries`: Previous surgeries text
   - `familyHistory`: Family medical history
   - `socialHistory`: Social history
   - `completed`: Boolean completion status
   - `completedAt`: Completion timestamp
   - `createdAt`: Timestamp
   - `updatedAt`: Timestamp

### Secondary Indexes:

1. **email-index**: `email (PK) - type (SK)` - For looking up doctors/patients by email
2. **doctorId-index**: `doctorId (PK) - type (SK)` - For querying doctor's patients, sessions
3. **patientId-index**: `patientId (PK) - type (SK)` - For querying patient's sessions and intakes

## Implementation Details

### Database Layer (`lib/db.ts`)

The database layer provides CRUD operations for all entities using AWS SDK v3:

```typescript
// Import necessary functions
import { 
  createDoctor, getDoctorById, getDoctorByEmail, updateDoctor,
  createPatient, getPatientById, getPatientsByDoctor, updatePatient,
  createSession, getSessionById, getSessionsByDoctor, getSessionsByPatient, updateSession,
  createIntake, getIntakeById, getIntakesByPatient, updateIntake
} from '@/lib/db'
```

**Key Features:**
- Uses `@aws-sdk/lib-dynamodb` DocumentClient for simplified data handling
- AWS IAM authentication via `@vercel/functions/oidc` with `AWS_ROLE_ARN` and `AWS_REGION`
- Automatic `updatedAt` timestamp management on all updates
- Parameterized expressions to prevent SQL injection
- `nanoid` for unique ID generation
- `removeUndefinedValues: true` to handle optional fields

### API Routes Integration

All API routes now use the database layer:

#### Authentication Routes
- **POST `/api/auth/signup`**: Creates doctor or patient in DynamoDB
- **POST `/api/auth/login`**: Queries DynamoDB to authenticate and return doctor data

#### Session Management
- **GET/POST `/api/sessions`**: Fetch or create sessions with DynamoDB persistence
- **GET `/api/clinical/soap`**: Generate SOAP notes and update session in DynamoDB

#### Patient Management
- **GET `/api/patients`**: List patients for a doctor from DynamoDB
- **GET `/api/patients/[id]`**: Fetch individual patient details

#### Intake Forms
- **GET/POST `/api/intakes`**: Submit and retrieve patient intake forms from DynamoDB

### Frontend Data Fetching

Pages now use SWR for real-time data fetching from the API endpoints:

```typescript
// Example: Dashboard fetching sessions
const { data: sessionsData, isLoading } = useSWR(
  doctorId ? `/api/sessions?doctorId=${doctorId}` : null,
  fetcher,
  { revalidateOnFocus: false, revalidateOnReconnect: true }
)
```

**Updated Pages:**
- `app/dashboard/page.tsx` - Real session stats and list
- `app/dashboard/patients/page.tsx` - Dynamic patient list with search
- `app/dashboard/sessions/[id]/page.tsx` - Individual session details
- `app/patient-intake/page.tsx` - Form submission to DynamoDB

## Environment Variables Required

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME
DYNAMODB_TABLE_NAME=noa-data
```

These are automatically set when you connect the Amazon DynamoDB integration.

## Error Handling

All database operations include:
- Try-catch blocks for error handling
- Descriptive error messages
- Proper HTTP status codes (400, 401, 404, 500)
- Console logging for debugging

## Data Flow Examples

### Creating a Doctor
```
POST /api/auth/signup
→ createDoctor() in db.ts
→ PutCommand to DynamoDB
→ Returns doctor object with ID
```

### Fetching Doctor's Sessions
```
GET /api/sessions?doctorId=doctor-xxx
→ getSessionsByDoctor() queries doctorId-index
→ Returns array of session objects
→ Frontend updates with real data
```

### Patient Submitting Intake
```
POST /api/intakes
→ createIntake() in db.ts
→ PutCommand stores to DynamoDB
→ Confirmation page shows intake ID
```

## Querying Tips

### Query by Email (Doctor Login)
```typescript
const doctor = await getDoctorByEmail(email)
// Uses email-index for fast lookup
```

### Query by Doctor ID (Fetch Patients/Sessions)
```typescript
const patients = await getPatientsByDoctor(doctorId)
const sessions = await getSessionsByDoctor(doctorId)
// Uses doctorId-index for fast lookup
```

### Query by Patient ID (Patient History)
```typescript
const sessions = await getSessionsByPatient(patientId)
const intakes = await getIntakesByPatient(patientId)
// Uses patientId-index for fast lookup
```

## Performance Considerations

- **Indexes:** All secondary indexes are configured for optimal query performance
- **Caching:** Frontend uses SWR with configurable revalidation
- **Batch Operations:** Use Promise.all() for parallel requests when needed
- **Pagination:** Implement cursor-based pagination for large result sets (future enhancement)

## Next Steps / TODO

1. **Production Deployment:**
   - Configure VPC endpoints for private DynamoDB access
   - Enable DynamoDB encryption at rest
   - Set up CloudWatch alarms for monitoring
   - Configure auto-scaling policies

2. **Data Validation:**
   - Add validation middleware for API routes
   - Implement schema validation with Zod or similar

3. **Audit Logging:**
   - Enable DynamoDB streams for audit trails
   - Store session recordings in S3
   - Track all modifications to patient data

4. **Advanced Features:**
   - Implement pagination for large result sets
   - Add full-text search capability
   - Set up data export functionality for compliance

5. **Testing:**
   - Unit tests for database operations
   - Integration tests for API routes
   - Performance testing for query optimization

## Troubleshooting

### "Credentials not found"
- Verify `AWS_ROLE_ARN` is correctly set
- Check IAM role has permissions to DynamoDB table
- Ensure environment variables are loaded

### "Table not found"
- Verify `DYNAMODB_TABLE_NAME` matches your actual table
- Check AWS region in `AWS_REGION`

### Slow queries
- Check secondary indexes are properly created
- Use CloudWatch to analyze query patterns
- Consider adding more specific indexes if needed

---

All pages are now connected to real DynamoDB infrastructure. The app is ready for testing with actual data persistence!
