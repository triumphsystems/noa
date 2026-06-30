import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { awsConfig, dynamodbClient } from './aws-config'

export const TABLE_NAME = awsConfig.dynamodb.tableName
export const PK = 'id'
export const SK = 'type'

export const docClient = DynamoDBDocumentClient.from(dynamodbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})
