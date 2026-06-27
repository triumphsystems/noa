import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, address, medicalConditions, surgeries, allergies, currentMedications } = body

    const intakeId = `intake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()

    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: process.env.AWS_DYNAMODB_INTAKES_TABLE || 'noa-intakes',
        Item: {
          intakeId,
          email,
          firstName,
          lastName,
          phone,
          address,
          medicalConditions,
          surgeries,
          allergies,
          currentMedications,
          createdAt: timestamp,
          updatedAt: timestamp,
          status: 'pending-review',
        },
      })
    )

    return NextResponse.json({
      success: true,
      intakeId,
      message: 'Intake form submitted successfully',
    })
  } catch (error) {
    console.error('[v0] Error saving intake:', error)
    return NextResponse.json(
      { message: 'Failed to submit intake form' },
      { status: 500 }
    )
  }
}
