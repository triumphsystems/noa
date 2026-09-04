import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb'
import { nanoid } from 'nanoid'
import { awsConfig, dynamodbClient } from './aws-config'

export const TABLE_NAME = awsConfig.dynamodb.tableName
const PK = 'id'
const SK = 'type'

const docClient = DynamoDBDocumentClient.from(dynamodbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

// ============ TYPES ============
export type DoctorVerificationStatus = 'pending' | 'verified' | 'rejected'

export interface Doctor {
  id: string
  type: 'doctor'
  email: string
  name: string
  specialty: string
  license: string
  issuingAuthority?: string
  licenseDocumentUrl?: string
  clinic: string
  careCode?: string
  verificationStatus: DoctorVerificationStatus
  verifiedAt?: number
  verifiedBy?: string
  rejectionReason?: string
  phone?: string
  avatar?: string
  createdAt: number
  updatedAt: number
}

export interface Patient {
  id: string
  type: 'patient'
  doctorId?: string
  pendingDoctorId?: string
  linkStatus?: 'linked' | 'pending_patient_approval' | 'pending_doctor_approval' | 'unlinked'
  linkRequestedBy?: 'doctor' | 'patient'
  linkRequestedAt?: number
  email: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  address?: string
  allergies?: string[]
  medications?: string[]
  conditions?: string[]
  avatar?: string
  createdAt: number
  updatedAt: number
}

export interface Session {
  id: string
  type: 'session'
  doctorId: string
  patientId: string
  startedAt: number
  endedAt?: number
  transcript?: string
  audioUrl?: string
  realTimeNotes?: unknown
  status: 'active' | 'completed' | 'archived'
  soapNote?: SoapNote
  createdAt: number
  updatedAt: number
}

export interface SoapNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
  generatedAt: number
}

export interface PatientIntake {
  id: string
  type: 'intake'
  patientId: string
  doctorId: string
  medicalHistory: string
  medications: string[]
  allergies: string[]
  surgeries?: string
  familyHistory?: string
  socialHistory?: string
  completed: boolean
  completedAt?: number
  createdAt: number
  updatedAt: number
}

// ============ DOCTOR OPERATIONS ============
export async function createDoctor(
  data: Omit<Doctor, 'id' | 'type' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Doctor> {
  const doctor: Doctor = {
    id: data.id || `doctor-${nanoid()}`,
    type: 'doctor',
    verificationStatus: data.verificationStatus || 'pending',
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: doctor,
    }),
  )

  return doctor
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'doctor' },
    }),
  )

  return (result.Item as Doctor) || null
}

export async function getDoctorByEmail(email: string): Promise<Doctor | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':email': email,
        ':type': 'doctor',
      },
    }),
  )

  return (result.Items?.[0] as Doctor) || null
}

export async function updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor | null> {
  const expressionParts: string[] = []
  const expressionAttributeNames: Record<string, string> = {}
  const expressionAttributeValues: Record<string, any> = {}

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'type' && key !== 'createdAt') {
      expressionParts.push(`#${key} = :${key}`)
      expressionAttributeNames[`#${key}`] = key
      expressionAttributeValues[`:${key}`] = value
    }
  })

  expressionParts.push('#updatedAt = :updatedAt')
  expressionAttributeNames['#updatedAt'] = 'updatedAt'
  expressionAttributeValues[':updatedAt'] = Date.now()

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'doctor' },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }),
  )

  return (result.Attributes as Doctor) || null
}

export function computeDoctorCareCode(doctor: Doctor): string {
  if (doctor.careCode) return doctor.careCode
  const suffix = doctor.id.replace('doctor-', '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()
  return `NOA-${suffix || 'DOC'}`
}

export async function getAllDoctors(): Promise<Doctor[]> {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type',
        },
        ExpressionAttributeValues: {
          ':type': 'doctor',
        },
        Limit: 100,
      })
    )
    const doctors = (result.Items || []) as Doctor[]
    return doctors.map(doc => ({
      ...doc,
      careCode: doc.careCode || computeDoctorCareCode(doc),
    }))
  } catch (err) {
    console.error('[DB] Error fetching all doctors:', err)
    return []
  }
}

export async function searchDoctors(queryStr: string): Promise<Doctor[]> {
  const query = (queryStr || '').trim().toLowerCase()
  if (!query) return []

  const doctors = await getAllDoctors()
  return doctors.filter(doc => {
    const nameMatch = (doc.name || '').toLowerCase().includes(query)
    const specialtyMatch = (doc.specialty || '').toLowerCase().includes(query)
    const clinicMatch = (doc.clinic || '').toLowerCase().includes(query)
    const emailMatch = (doc.email || '').toLowerCase().includes(query)
    const codeMatch =
      (doc.careCode || '').toLowerCase().includes(query.replace(/[^a-zA-Z0-9]/g, '')) ||
      (doc.careCode || '').toLowerCase() === query

    return nameMatch || specialtyMatch || clinicMatch || emailMatch || codeMatch
  })
}

export async function getDoctorByCareCode(codeStr: string): Promise<Doctor | null> {
  const code = (codeStr || '').trim().toLowerCase()
  if (!code) return null

  // Direct lookup if query is an email
  if (code.includes('@')) {
    return await getDoctorByEmail(code)
  }

  // Direct lookup if query is an exact doctor ID
  if (code.startsWith('doctor-')) {
    return await getDoctorById(code)
  }

  const doctors = await getAllDoctors()
  return (
    doctors.find(doc => {
      const computed = (doc.careCode || computeDoctorCareCode(doc)).toLowerCase()
      return computed === code || computed.replace('noa-', '') === code.replace('noa-', '')
    }) || null
  )
}

export async function getDoctorsByVerificationStatus(status: DoctorVerificationStatus): Promise<Doctor[]> {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#type = :type AND verificationStatus = :status',
        ExpressionAttributeNames: {
          '#type': 'type',
        },
        ExpressionAttributeValues: {
          ':type': 'doctor',
          ':status': status,
        },
        Limit: 100,
      })
    )
    const doctors = (result.Items || []) as Doctor[]
    return doctors.map(doc => ({
      ...doc,
      careCode: doc.careCode || computeDoctorCareCode(doc),
    }))
  } catch (err) {
    console.error('[DB] Error fetching doctors by verification status:', err)
    return []
  }
}

export async function updateDoctorVerification(
  id: string,
  status: DoctorVerificationStatus,
  adminId: string,
  rejectionReason?: string
): Promise<Doctor | null> {
  const updates: Partial<Doctor> = {
    verificationStatus: status,
    verifiedBy: adminId,
    verifiedAt: status === 'verified' ? Date.now() : undefined,
    rejectionReason: status === 'rejected' ? rejectionReason : undefined,
  }
  return updateDoctor(id, updates)
}

// ============ PATIENT OPERATIONS ============
export async function createPatient(
  data: Omit<Patient, 'id' | 'type' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Patient> {
  const patient: Patient = {
    id: data.id || `patient-${nanoid()}`,
    type: 'patient',
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: patient,
    }),
  )

  return patient
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'patient' },
    }),
  )

  return (result.Item as Patient) || null
}

export async function getPatientByEmail(email: string): Promise<Patient | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':email': email.trim().toLowerCase(),
        ':type': 'patient',
      },
    }),
  )

  return (result.Items?.[0] as Patient) || null
}

export async function getPatientsByDoctor(doctorId: string): Promise<Patient[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'doctorId-index',
      KeyConditionExpression: 'doctorId = :doctorId AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':doctorId': doctorId,
        ':type': 'patient',
      },
    }),
  )

  return (result.Items || []) as Patient[]
}

export async function getPendingPatientsByDoctor(doctorId: string): Promise<Patient[]> {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#type = :type AND pendingDoctorId = :doctorId',
        ExpressionAttributeNames: {
          '#type': 'type',
        },
        ExpressionAttributeValues: {
          ':type': 'patient',
          ':doctorId': doctorId,
        },
      })
    )
    return (result.Items || []) as Patient[]
  } catch (err) {
    console.error('[DB] Error getting pending patients by doctor:', err)
    return []
  }
}

export async function updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
  const expressionParts: string[] = []
  const expressionAttributeNames: Record<string, string> = {}
  const expressionAttributeValues: Record<string, any> = {}

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'type' && key !== 'createdAt') {
      expressionParts.push(`#${key} = :${key}`)
      expressionAttributeNames[`#${key}`] = key
      expressionAttributeValues[`:${key}`] = value
    }
  })

  expressionParts.push('#updatedAt = :updatedAt')
  expressionAttributeNames['#updatedAt'] = 'updatedAt'
  expressionAttributeValues[':updatedAt'] = Date.now()

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'patient' },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }),
  )

  return (result.Attributes as Patient) || null
}

export async function deletePatient(id: string): Promise<boolean> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'patient' },
    }),
  )
  return true
}

// ============ SESSION OPERATIONS ============
export async function createSession(
  data: Omit<Session, 'id' | 'type' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Session> {
  const session: Session = {
    id: data.id || `session-${nanoid()}`,
    type: 'session',
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: session,
    }),
  )

  return session
}

export async function getSessionById(id: string): Promise<Session | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'session' },
    }),
  )

  return (result.Item as Session) || null
}

export async function getSessionsByDoctor(doctorId: string): Promise<Session[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'doctorId-index',
      KeyConditionExpression: 'doctorId = :doctorId AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':doctorId': doctorId,
        ':type': 'session',
      },
    }),
  )

  return (result.Items || []) as Session[]
}

export async function getSessionsByPatient(patientId: string): Promise<Session[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'patientId-index',
      KeyConditionExpression: 'patientId = :patientId AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':patientId': patientId,
        ':type': 'session',
      },
    }),
  )

  return (result.Items || []) as Session[]
}

export async function updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
  const expressionParts: string[] = []
  const expressionAttributeNames: Record<string, string> = {}
  const expressionAttributeValues: Record<string, any> = {}

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'type' && key !== 'createdAt') {
      if (key === 'soapNote') {
        expressionParts.push(`#soapNote = :soapNote`)
        expressionAttributeNames['#soapNote'] = 'soapNote'
        expressionAttributeValues[':soapNote'] = value
      } else {
        expressionParts.push(`#${key} = :${key}`)
        expressionAttributeNames[`#${key}`] = key
        expressionAttributeValues[`:${key}`] = value
      }
    }
  })

  expressionParts.push('#updatedAt = :updatedAt')
  expressionAttributeNames['#updatedAt'] = 'updatedAt'
  expressionAttributeValues[':updatedAt'] = Date.now()

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'session' },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }),
  )

  return (result.Attributes as Session) || null
}

// ============ INTAKE OPERATIONS ============
export async function createIntake(data: Omit<PatientIntake, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<PatientIntake> {
  const intake: PatientIntake = {
    id: `intake-${nanoid()}`,
    type: 'intake',
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: intake,
    }),
  )

  return intake
}

export async function getIntakeById(id: string): Promise<PatientIntake | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'intake' },
    }),
  )

  return (result.Item as PatientIntake) || null
}

export async function getIntakesByPatient(patientId: string): Promise<PatientIntake[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'patientId-index',
      KeyConditionExpression: 'patientId = :patientId AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':patientId': patientId,
        ':type': 'intake',
      },
    }),
  )

  return (result.Items || []) as PatientIntake[]
}

export async function updateIntake(id: string, updates: Partial<PatientIntake>): Promise<PatientIntake | null> {
  const expressionParts: string[] = []
  const expressionAttributeNames: Record<string, string> = {}
  const expressionAttributeValues: Record<string, any> = {}

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'type' && key !== 'createdAt') {
      expressionParts.push(`#${key} = :${key}`)
      expressionAttributeNames[`#${key}`] = key
      expressionAttributeValues[`:${key}`] = value
    }
  })

  expressionParts.push('#updatedAt = :updatedAt')
  expressionAttributeNames['#updatedAt'] = 'updatedAt'
  expressionAttributeValues[':updatedAt'] = Date.now()

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'intake' },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }),
  )

  return (result.Attributes as PatientIntake) || null
}

export async function completeSession(id: string): Promise<Session | null> {
  return updateSession(id, { status: 'completed', endedAt: Date.now() })
}

export async function updateSessionSoapNote(id: string, soapNote: SoapNote): Promise<Session | null> {
  return updateSession(id, { soapNote })
}

export async function updateSessionTranscript(id: string, transcript: string): Promise<Session | null> {
  return updateSession(id, { transcript })
}

export async function getPatientIntake(patientId: string): Promise<PatientIntake | null> {
  const intakes = await getIntakesByPatient(patientId)
  return intakes[0] || null
}

export async function savePatientIntake(
  data: Omit<PatientIntake, 'id' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<PatientIntake> {
  return createIntake(data)
}

// ============ ADMIN OPERATIONS ============
export interface AdminUser {
  id: string
  type: 'admin'
  email: string
  name: string
  role: 'superadmin' | 'clinical_admin'
  createdAt: number
  updatedAt: number
}

export async function createAdminUser(
  data: Omit<AdminUser, 'type' | 'createdAt' | 'updatedAt'>
): Promise<AdminUser> {
  const admin: AdminUser = {
    ...data,
    type: 'admin',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: admin,
    })
  )

  return admin
}

export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':email': email.trim().toLowerCase(),
        ':type': 'admin',
      },
    })
  )

  return (result.Items?.[0] as AdminUser) || null
}

export async function getAdminById(id: string): Promise<AdminUser | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'admin' },
    })
  )

  return (result.Item as AdminUser) || null
}

