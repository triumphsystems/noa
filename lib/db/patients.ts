import {
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { docClient, TABLE_NAME, PK, SK, batchGetItems } from './client';
import { buildUpdateExpression } from './update-expression';
import type { Patient } from './types';

export async function createPatient(
  data: Omit<Patient, 'id' | 'type' | 'createdAt' | 'updatedAt'> & {
    id?: string;
  }
): Promise<Patient> {
  const patient: Patient = {
    id: data.id || nanoid(),
    type: 'patient',
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: patient,
    })
  );

  return patient;
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'patient' },
    })
  );

  return (result.Item as Patient) || null;
}

export async function migratePatientId(
  oldId: string,
  newId: string
): Promise<Patient> {
  const oldPatient = await getPatientById(oldId);
  if (!oldPatient) {
    throw new Error(`Patient with id ${oldId} not found for migration`);
  }

  if (oldId === newId) {
    return oldPatient;
  }

  const updatedPatient: Patient = {
    ...oldPatient,
    id: newId,
    updatedAt: Date.now(),
  };

  await docClient.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLE_NAME,
            Item: updatedPatient,
            ConditionExpression: 'attribute_not_exists(#pk)',
            ExpressionAttributeNames: { '#pk': PK },
          },
        },
        {
          Delete: {
            TableName: TABLE_NAME,
            Key: { [PK]: oldId, [SK]: 'patient' },
          },
        },
      ],
    })
  );

  return updatedPatient;
}

export async function getPatientByEmail(
  email: string
): Promise<Patient | null> {
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
    })
  );

  const item = result.Items?.[0];
  if (!item?.id) return null;
  return await getPatientById(item.id);
}

export async function getPatientsByDoctor(
  doctorId: string
): Promise<Patient[]> {
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
          ':type': 'patient',
        },
      })
    );

    const keys = (result.Items || []).map((item) => ({
      id: item.id as string,
      type: 'patient',
    }));
    if (keys.length === 0) return [];
    return await batchGetItems<Patient>(keys);
  } catch (err) {
    console.error('[DB] Error getting patients by doctor:', err);
    return [];
  }
}

export async function getPendingPatientsByDoctor(
  doctorId: string
): Promise<Patient[]> {
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
    );
    return (result.Items || []) as Patient[];
  } catch (err) {
    console.error('[DB] Error getting pending patients by doctor:', err);
    return [];
  }
}

export async function updatePatient(
  id: string,
  updates: Partial<Patient>
): Promise<Patient | null> {
  const {
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  } = buildUpdateExpression(updates as Record<string, unknown>);

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'patient' },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return (result.Attributes as Patient) || null;
}

export async function deletePatient(id: string): Promise<boolean> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'patient' },
    })
  );
  return true;
}
