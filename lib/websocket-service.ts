/**
 * Serverless Consultation Session State Manager
 * 
 * Replaces legacy in-memory WebSocket Map with DynamoDB persistence.
 * Safe for serverless environments (Vercel & AWS Lambda) with zero state loss across function instances.
 */

import { getSessionById, updateSession, createSession, Session, SoapNote } from '@/lib/db'

export interface ServerlessSessionState {
  sessionId: string
  doctorId: string
  patientId: string
  transcript: string
  startedAt: number
  isRecording: boolean
}

/**
 * Retrieve session state from DynamoDB
 */
export async function getSessionState(sessionId: string): Promise<Session | null> {
  return await getSessionById(sessionId)
}

/**
 * Append transcript segment to DynamoDB session
 */
export async function appendTranscriptToSession(
  sessionId: string,
  newText: string,
  metadata?: { doctorId?: string; patientId?: string }
): Promise<string> {
  const existing = await getSessionById(sessionId)
  if (existing) {
    const updated = existing.transcript ? `${existing.transcript}\n${newText}` : newText
    await updateSession(sessionId, { transcript: updated })
    return updated
  }

  await createSession({
    id: sessionId,
    doctorId: metadata?.doctorId || 'unknown-doctor',
    patientId: metadata?.patientId || 'unknown-patient',
    startedAt: Date.now(),
    status: 'active',
    transcript: newText,
  })
  return newText
}

/**
 * Mark session as completed in DynamoDB
 */
export async function closeSession(sessionId: string, soapNote?: SoapNote): Promise<Session | null> {
  return await updateSession(sessionId, {
    status: 'completed',
    endedAt: Date.now(),
    ...(soapNote ? { soapNote } : {}),
  })
}
