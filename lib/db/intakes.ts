import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { docClient, TABLE_NAME, PK, SK, batchGetItems } from './client';
import { buildUpdateExpression } from './update-expression';
import type { PatientIntake } from './types';

export async function createIntake(
  data: Omit<PatientIntake, 'id' | 'type' | 'createdAt' | 'updatedAt'> & {
    id?: string;
  }
): Promise<PatientIntake> {
  const intake: PatientIntake = {
    id: data.id || `intake-${nanoid()}`,
    type: 'intake',
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: intake,
    })
  );

  return intake;
}

export async function getIntakeById(id: string): Promise<PatientIntake | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'intake' },
    })
  );

  return (result.Item as PatientIntake) || null;
}

export async function getIntakesByPatient(
  patientId: string
): Promise<PatientIntake[]> {
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
    })
  );

  const keys = (result.Items || []).map((item) => ({
    id: item.id as string,
    type: 'intake',
  }));
  if (keys.length === 0) return [];
  return await batchGetItems<PatientIntake>(keys);
}

export async function updateIntake(
  id: string,
  updates: Partial<PatientIntake>
): Promise<PatientIntake | null> {
  const {
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  } = buildUpdateExpression(updates as Record<string, unknown>);

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'intake' },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return (result.Attributes as PatientIntake) || null;
}

export async function getPatientIntake(
  patientId: string
): Promise<PatientIntake | null> {
  const intakes = await getIntakesByPatient(patientId);
  return intakes[0] || null;
}

export async function savePatientIntake(
  data: Omit<PatientIntake, 'id' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<PatientIntake> {
  return createIntake(data);
}
