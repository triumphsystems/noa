import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PK, SK } from './client';
import type { AdminUser } from './types';

export async function createAdminUser(
  data: Omit<AdminUser, 'type' | 'createdAt' | 'updatedAt'>
): Promise<AdminUser> {
  const admin: AdminUser = {
    ...data,
    type: 'admin',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: admin,
    })
  );

  return admin;
}

export async function getAdminByEmail(
  email: string
): Promise<AdminUser | null> {
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
  );

  const item = result.Items?.[0];
  if (!item?.id) return null;
  return await getAdminById(item.id);
}

export async function getAdminById(id: string): Promise<AdminUser | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: 'admin' },
    })
  );

  return (result.Item as AdminUser) || null;
}
