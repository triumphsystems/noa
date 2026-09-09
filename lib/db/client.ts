import {
  DynamoDBDocumentClient,
  BatchGetCommand,
} from '@aws-sdk/lib-dynamodb';
import { awsConfig, dynamodbClient } from '@/lib/aws-config';

export const TABLE_NAME = awsConfig.dynamodb.tableName;
export const PK = 'id';
export const SK = 'type';

export const docClient = DynamoDBDocumentClient.from(dynamodbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

/**
 * Hydrates full items from the primary DynamoDB table for GSIs configured with KEYS_ONLY projection.
 */
export async function batchGetItems<T>(
  keys: Array<{ id: string; type: string }>
): Promise<T[]> {
  if (!keys || keys.length === 0) return [];

  const uniqueKeysMap = new Map<string, { id: string; type: string }>();
  keys.forEach((k) => {
    if (k.id && k.type) {
      uniqueKeysMap.set(`${k.id}#${k.type}`, k);
    }
  });
  const uniqueKeys = Array.from(uniqueKeysMap.values());
  if (uniqueKeys.length === 0) return [];

  const chunks: Array<Array<{ id: string; type: string }>> = [];
  for (let i = 0; i < uniqueKeys.length; i += 100) {
    chunks.push(uniqueKeys.slice(i, i + 100));
  }

  const results: T[] = [];
  for (const chunk of chunks) {
    const res = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: chunk.map((k) => ({ [PK]: k.id, [SK]: k.type })),
          },
        },
      })
    );
    const items = (res.Responses?.[TABLE_NAME] || []) as T[];
    results.push(...items);
  }

  const itemMap = new Map<string, any>();
  results.forEach((item) => {
    if ((item as any)?.id) {
      itemMap.set((item as any).id, item);
    }
  });

  const ordered: T[] = [];
  for (const k of uniqueKeys) {
    const it = itemMap.get(k.id);
    if (it) ordered.push(it);
  }

  return ordered;
}
