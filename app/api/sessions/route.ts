import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, transcripts, soapNote, duration } = body

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()

    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: process.env.AWS_DYNAMODB_SESSIONS_TABLE || 'noa-sessions',
        Item: {
          sessionId,
          patientId,
          doctorId: 'doctor-001', // Would come from auth context
          transcripts,
          soapNote,
          duration,
          createdAt: timestamp,
          updatedAt: timestamp,
          status: 'completed',
        },
      })
    )

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Session saved successfully',
    })
  } catch (error) {
    console.error('[v0] Error saving session:', error)
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      )
    }

    // Query sessions for patient
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.AWS_DYNAMODB_SESSIONS_TABLE || 'noa-sessions',
        IndexName: 'patientId-createdAt-index',
        KeyConditionExpression: 'patientId = :patientId',
        ExpressionAttributeValues: {
          ':patientId': patientId,
        },
        ScanIndexForward: false, // Sort descending
        Limit: 10,
      })
    )

    return NextResponse.json({
      sessions: result.Items || [],
    })
  } catch (error) {
    console.error('[v0] Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
