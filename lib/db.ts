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
export interface Doctor {
  id: string
  type: 'doctor'
  email: string
  name: string
  specialty: string
  license: string
  clinic: string
  phone?: string
  avatar?: string
  createdAt: number
  updatedAt: number
}

export interface Patient {
  id: string
  type: 'patient'
  doctorId?: string
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
export async function createSession(data: Omit<Session, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Session> {
  const session: Session = {
    id: `session-${nanoid()}`,
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

