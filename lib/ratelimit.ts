/**
 * Distributed Serverless Rate Limiter
 * Backed by DynamoDB atomic counters with automatic TTL expiration.
 * Global synchronization across all serverless function instances.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamodbClient, awsConfig, getAwsCredentials } from './aws-config'

export const TABLE_NAME = awsConfig.dynamodb.tableName

const docClient = DynamoDBDocumentClient.from(dynamodbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number
  /** Duration of window in seconds (default: 60) */
  windowSeconds?: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Epoch timestamp in seconds when the window resets
}

// In-memory fallback for local development or test suites when DynamoDB is offline
const localFallbackMap = new Map<string, { count: number; reset: number }>()

/**
 * Extract client identifier from NextRequest (IP or Authenticated User)
 */
export function getClientIdentifier(req: NextRequest, customId?: string): string {
  if (customId && customId.trim().length > 0) {
    return customId.trim()
  }

  // Check auth session cookie
  const sessionCookie = req.cookies.get('noa_session')?.value
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie)
      if (parsed.doctorId) return `doctor:${parsed.doctorId}`
      if (parsed.patientId) return `patient:${parsed.patientId}`
      if (parsed.email) return `user:${parsed.email}`
    } catch {
      // Ignore parse failure
    }
  }

  // Fallback to IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1'
  return `ip:${ip}`
}

/**
 * Atomically check and increment rate limit counter in DynamoDB.
 * Safe across all distributed Vercel serverless instances.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 20, windowSeconds: 60 }
): Promise<RateLimitResult> {
  const windowSeconds = config.windowSeconds || 60
  const limit = config.limit
  const now = Math.floor(Date.now() / 1000)
  const windowSlot = Math.floor(now / windowSeconds) * windowSeconds
  const reset = windowSlot + windowSeconds
  const recordId = `ratelimit#${identifier}#${windowSlot}`

  const hasAwsCredentials = Boolean(getAwsCredentials())

  // If AWS credentials exist, use distributed DynamoDB atomic counter
  if (hasAwsCredentials) {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          id: recordId,
          type: 'ratelimit',
        },
        UpdateExpression: 'ADD #cnt :inc SET #ttl = :ttl, #ident = :ident',
        ExpressionAttributeNames: {
          '#cnt': 'count',
          '#ttl': 'ttl',
          '#ident': 'identifier',
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':ttl': reset + 120, // Retain for 2 mins after reset for safety
          ':ident': identifier,
        },
        ReturnValues: 'ALL_NEW',
      })

      const response = await docClient.send(command)
      const currentCount = Number(response.Attributes?.count || 1)
      const remaining = Math.max(0, limit - currentCount)

      return {
        success: currentCount <= limit,
        limit,
        remaining,
        reset,
      }
    } catch (err) {
      console.warn('[RateLimit] DynamoDB rate limit call failed, falling back to local window:', err)
      // Fall through to in-memory fallback
    }
  }

  // In-memory fallback (Local dev / testing)
  const cached = localFallbackMap.get(recordId)
  if (!cached || cached.reset < now) {
    localFallbackMap.set(recordId, { count: 1, reset })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset,
    }
  }

  cached.count += 1
  const remaining = Math.max(0, limit - cached.count)
  return {
    success: cached.count <= limit,
    limit,
    remaining,
    reset: cached.reset,
  }
}

/**
 * Standard HTTP 429 Too Many Requests response with RFC rate limit headers
 */
export function rateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.max(1, result.reset - Math.floor(Date.now() / 1000))

  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Maximum ${result.limit} requests per minute allowed on this endpoint. Please retry in ${retryAfter} seconds.`,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  )
}
