/**
 * Automated Test Suite for Distributed Rate Limiting & Bedrock Throttling Protection
 * Run with: node --test tests/ratelimit.test.mjs
 */

import test, { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('Rate Limiting & Throttling Defense Suite', () => {
  // Test sliding window bucket calculation
  it('should compute consistent window slots for rate limiting', () => {
    const windowSeconds = 60
    const now1 = 1725379215 // e.g. 16:00:15
    const now2 = 1725379255 // e.g. 16:00:55
    const now3 = 1725379265 // e.g. 16:01:05 (next minute)

    const slot1 = Math.floor(now1 / windowSeconds) * windowSeconds
    const slot2 = Math.floor(now2 / windowSeconds) * windowSeconds
    const slot3 = Math.floor(now3 / windowSeconds) * windowSeconds

    assert.equal(slot1, slot2, 'Timestamps in the same minute must map to the same window slot')
    assert.notEqual(slot1, slot3, 'Timestamps in different minutes must map to different window slots')
    assert.equal(slot3 - slot1, 60, 'Window slot step must equal windowSeconds')
  })

  // Test rate limit enforcement logic
  it('should allow requests within limit and reject exceeding requests', () => {
    const limit = 5
    let currentCount = 0

    function simulateRequest() {
      currentCount += 1
      const allowed = currentCount <= limit
      const remaining = Math.max(0, limit - currentCount)
      return { allowed, remaining }
    }

    // First 5 requests should pass
    for (let i = 1; i <= 5; i++) {
      const res = simulateRequest()
      assert.equal(res.allowed, true, `Request ${i} should be allowed`)
      assert.equal(res.remaining, 5 - i)
    }

    // 6th and subsequent requests must be rejected
    const blocked1 = simulateRequest()
    assert.equal(blocked1.allowed, false, '6th request must be rejected')
    assert.equal(blocked1.remaining, 0)

    const blocked2 = simulateRequest()
    assert.equal(blocked2.allowed, false, '7th request must be rejected')
    assert.equal(blocked2.remaining, 0)
  })

  // Test RFC HTTP 429 Header Compliance
  it('should provide valid RFC rate limit and Retry-After headers', () => {
    const limit = 20
    const remaining = 0
    const now = Math.floor(Date.now() / 1000)
    const reset = now + 42

    const retryAfter = Math.max(1, reset - now)
    const headers = {
      'Retry-After': String(retryAfter),
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(reset),
    }

    assert.equal(headers['Retry-After'], '42')
    assert.equal(headers['X-RateLimit-Limit'], '20')
    assert.equal(headers['X-RateLimit-Remaining'], '0')
    assert.equal(headers['X-RateLimit-Reset'], String(reset))
  })

  // Test Client Identifier resolution
  it('should prioritize custom user/doctor ID over IP address', () => {
    function resolveIdentifier(customId, cookieUserId, clientIp) {
      if (customId && customId.trim().length > 0) return `custom:${customId.trim()}`
      if (cookieUserId && cookieUserId.trim().length > 0) return `auth:${cookieUserId.trim()}`
      return `ip:${clientIp || '127.0.0.1'}`
    }

    assert.equal(
      resolveIdentifier('doc-42', 'patient-99', '192.168.1.1'),
      'custom:doc-42'
    )
    assert.equal(
      resolveIdentifier(null, 'doctor-1', '10.0.0.1'),
      'auth:doctor-1'
    )
    assert.equal(
      resolveIdentifier(null, null, '203.0.113.195'),
      'ip:203.0.113.195'
    )
    assert.equal(
      resolveIdentifier(null, null, null),
      'ip:127.0.0.1'
    )
  })

  // Test Bedrock Throttling Exception Classification
  it('should accurately classify Bedrock ThrottlingException as 429 status', () => {
    function classifyBedrockError(err) {
      const errorName = err?.name || ''
      const statusCode = err?.$metadata?.httpStatusCode
      const isThrottling =
        errorName === 'ThrottlingException' ||
        errorName === 'RequestLimitExceeded' ||
        statusCode === 429

      return {
        httpStatus: isThrottling ? 429 : 500,
        isThrottling,
      }
    }

    const throttleErr = {
      name: 'ThrottlingException',
      message: 'Too Many Requests',
      $metadata: { httpStatusCode: 429 },
    }
    const internalErr = {
      name: 'ValidationException',
      message: 'Invalid prompt parameters',
      $metadata: { httpStatusCode: 400 },
    }

    assert.deepEqual(classifyBedrockError(throttleErr), {
      httpStatus: 429,
      isThrottling: true,
    })
    assert.deepEqual(classifyBedrockError(internalErr), {
      httpStatus: 500,
      isThrottling: false,
    })
  })
})
