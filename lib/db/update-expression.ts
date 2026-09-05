/**
 * Shared DynamoDB Update Expression Builder
 * Eliminates duplicated expression logic across all entity update functions.
 */

export interface UpdateExpressionResult {
  UpdateExpression: string
  ExpressionAttributeNames: Record<string, string>
  ExpressionAttributeValues: Record<string, unknown> | undefined
}

/**
 * Builds a DynamoDB UpdateExpression, ExpressionAttributeNames, and
 * ExpressionAttributeValues from a plain updates object.
 *
 * - Skips 'id', 'type', 'createdAt' (immutable keys)
 * - Skips undefined values
 * - REMOVE attribute when value is explicitly null
 * - Always adds updatedAt = Date.now()
 */
export function buildUpdateExpression(
  updates: Record<string, unknown>,
  extraSkipKeys: string[] = []
): UpdateExpressionResult {
  const skipKeys = new Set(['id', 'type', 'createdAt', ...extraSkipKeys])
  const setParts: string[] = []
  const removeParts: string[] = []
  const expressionAttributeNames: Record<string, string> = {}
  const expressionAttributeValues: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(updates)) {
    if (skipKeys.has(key)) continue
    if (value === undefined) continue

    if (value === null) {
      removeParts.push(`#${key}`)
      expressionAttributeNames[`#${key}`] = key
      continue
    }

    setParts.push(`#${key} = :${key}`)
    expressionAttributeNames[`#${key}`] = key
    expressionAttributeValues[`:${key}`] = value
  }

  // Always update the updatedAt timestamp
  setParts.push('#updatedAt = :updatedAt')
  expressionAttributeNames['#updatedAt'] = 'updatedAt'
  expressionAttributeValues[':updatedAt'] = Date.now()

  const expressions: string[] = []
  if (setParts.length > 0) expressions.push(`SET ${setParts.join(', ')}`)
  if (removeParts.length > 0) expressions.push(`REMOVE ${removeParts.join(', ')}`)

  return {
    UpdateExpression: expressions.join(' '),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues:
      Object.keys(expressionAttributeValues).length > 0
        ? expressionAttributeValues
        : undefined,
  }
}
