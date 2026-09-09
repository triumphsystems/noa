import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { docClient, TABLE_NAME, PK, SK, batchGetItems } from './client';
import { buildUpdateExpression } from './update-expression';
import type { Session, SoapNote } from './types';

export async function createSession(
  data: Omit<Session, 'id' | 'type' | 'createdAt' | 'updatedAt'> & {
    id?: string;
  }
): Promise<Session> {
  const session: Session = {
    id: data.id || `session-${nanoid()}`,
    type: 'session',
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: session,
    })
  );

  return session;
}

export async function getSessionById(id: string): Promise<Session | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'session' },
    })
  );

  return (result.Item as Session) || null;
}

export async function getSessionsByDoctor(
  doctorId: string
): Promise<Session[]> {
  try {
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
      })
    );

    const keys = (result.Items || []).map((item) => ({
      id: item.id as string,
      type: 'session',
    }));
    if (keys.length === 0) return [];
    return await batchGetItems<Session>(keys);
  } catch (err) {
    console.error('[DB] Error getting sessions by doctor:', err);
    return [];
  }
}

export async function getSessionsByPatient(
  patientId: string
): Promise<Session[]> {
  try {
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
      })
    );

    const keys = (result.Items || []).map((item) => ({
      id: item.id as string,
      type: 'session',
    }));
    if (keys.length === 0) return [];
    return await batchGetItems<Session>(keys);
  } catch (err) {
    console.error('[DB] Error getting sessions by patient:', err);
    return [];
  }
}

export async function updateSession(
  id: string,
  updates: Partial<Session>
): Promise<Session | null> {
  const {
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  } = buildUpdateExpression(updates as Record<string, unknown>);

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'session' },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return (result.Attributes as Session) || null;
}

export async function completeSession(id: string): Promise<Session | null> {
  return updateSession(id, { status: 'completed', endedAt: Date.now() });
}

export async function updateSessionSoapNote(
  id: string,
  soapNote: SoapNote
): Promise<Session | null> {
  return updateSession(id, { soapNote });
}

export async function updateSessionTranscript(
  id: string,
  transcript: string
): Promise<Session | null> {
  return updateSession(id, { transcript });
}
