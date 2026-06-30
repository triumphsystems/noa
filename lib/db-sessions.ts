import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { nanoid } from 'nanoid'
import { docClient, TABLE_NAME, PK, SK } from './db-client'
import { executeUpdate } from './db-helpers'
import type { Session } from './db-types'

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
    })
  )

  return session
}

export async function getSessionById(id: string): Promise<Session | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'session' },
    })
  )

  return (result.Item as Session) || null
}

export async function getSessionsByDoctor(doctorId: string): Promise<Session[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'doctorId-index',
      KeyConditionExpression: 'doctorId = :doctorId AND #type = :type',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: { ':doctorId': doctorId, ':type': 'session' },
    })
  )

  return (result.Items || []) as Session[]
}

export async function getSessionsByPatient(patientId: string): Promise<Session[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'patientId-index',
      KeyConditionExpression: 'patientId = :patientId AND #type = :type',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: { ':patientId': patientId, ':type': 'session' },
    })
  )

  return (result.Items || []) as Session[]
}

export async function updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
  return executeUpdate<Session>(id, 'session', updates)
}
