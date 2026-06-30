import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { nanoid } from 'nanoid'
import { docClient, TABLE_NAME, PK, SK } from './db-client'
import { executeUpdate } from './db-helpers'
import type { Doctor } from './db-types'

export async function createDoctor(data: Omit<Doctor, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Doctor> {
  const doctor: Doctor = {
    id: `doctor-${nanoid()}`,
    type: 'doctor',
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: doctor,
    })
  )

  return doctor
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'doctor' },
    })
  )

  return (result.Item as Doctor) || null
}

export async function getDoctorByEmail(email: string): Promise<Doctor | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email AND #type = :type',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: { ':email': email, ':type': 'doctor' },
    })
  )

  return (result.Items?.[0] as Doctor) || null
}

export async function updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor | null> {
  return executeUpdate<Doctor>(id, 'doctor', updates)
}
