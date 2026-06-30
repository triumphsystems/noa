import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { docClient, TABLE_NAME, PK, SK } from './db-client'

export function buildUpdateExpression(
  updates: Record<string, any>,
  excludeKeys: string[] = ['id', 'type', 'createdAt']
): {
  UpdateExpression: string
  ExpressionAttributeNames: Record<string, string>
  ExpressionAttributeValues: Record<string, any>
} {
  const expressionParts: string[] = []
  const attributeNames: Record<string, string> = {}
  const attributeValues: Record<string, any> = {}

  Object.entries(updates).forEach(([key, value]) => {
    if (!excludeKeys.includes(key)) {
      expressionParts.push(`#${key} = :${key}`)
      attributeNames[`#${key}`] = key
      attributeValues[`:${key}`] = value
    }
  })

  expressionParts.push('#updatedAt = :updatedAt')
  attributeNames['#updatedAt'] = 'updatedAt'
  attributeValues[':updatedAt'] = Date.now()

  return {
    UpdateExpression: `SET ${expressionParts.join(', ')}`,
    ExpressionAttributeNames: attributeNames,
    ExpressionAttributeValues: attributeValues,
  }
}

export async function executeUpdate<T>(
  id: string,
  type: string,
  updates: Record<string, any>
): Promise<T | null> {
  const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } = buildUpdateExpression(updates)

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: id, [SK]: type },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  )

  return (result.Attributes as T) || null
}
