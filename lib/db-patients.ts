import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { nanoid } from 'nanoid'
import { docClient, TABLE_NAME, PK, SK } from './db-client'
import { executeUpdate } from './db-helpers'
import type { Patient } from './db-types'

export async function createPatient(data: Omit<Patient, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
  const patient: Patient = {
    id: `patient-${nanoid()}`,
    type: 'patient',
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: patient,
    })
  )

  return patient
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'patient' },
    })
  )

  return (result.Item as Patient) || null
}

export async function getPatientsByDoctor(doctorId: string): Promise<Patient[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'doctorId-index',
      KeyConditionExpression: 'doctorId = :doctorId AND #type = :type',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: { ':doctorId': doctorId, ':type': 'patient' },
    })
  )

  return (result.Items || []) as Patient[]
}

export async function updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
  return executeUpdate<Patient>(id, 'patient', updates)
}
