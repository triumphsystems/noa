import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

interface SessionMessage {
  type: 'transcript' | 'audio' | 'status' | 'suggestion' | 'note' | 'end'
  content: string
  sessionId: string
  timestamp: number
}

interface SessionState {
  sessionId: string
  doctorId: string
  patientId: string
  transcript: string[]
  startTime: number
  isRecording: boolean
  clientIds: string[]
}

// In-memory store for active sessions (in production, use Redis)
const activeSessions = new Map<string, SessionState>()

export function initializeWebSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', socket => {
    console.log('[v0] WebSocket client connected:', socket.id)

    socket.on('join-session', (data: { sessionId: string; userId: string; userType: string }) => {
      const { sessionId, userId, userType } = data
      socket.join(`session-${sessionId}`)

      let session = activeSessions.get(sessionId)
      if (!session) {
        session = {
          sessionId,
          doctorId: userType === 'doctor' ? userId : '',
          patientId: userType === 'patient' ? userId : '',
          transcript: [],
          startTime: Date.now(),
          isRecording: false,
          clientIds: [],
        }
        activeSessions.set(sessionId, session)
      }

      session.clientIds.push(socket.id)

      io.to(`session-${sessionId}`).emit('session-joined', {
        sessionId,
        participantCount: session.clientIds.length,
        transcript: session.transcript,
      })

      console.log(`[v0] User ${userId} joined session ${sessionId}`)
    })

    socket.on('transcript-update', (data: { sessionId: string; text: string }) => {
      const { sessionId, text } = data
      const session = activeSessions.get(sessionId)

      if (session) {
        session.transcript.push(text)

        io.to(`session-${sessionId}`).emit('transcript-updated', {
          sessionId,
          newLine: text,
          fullTranscript: session.transcript.join('\n'),
        })
      }
    })

    socket.on('audio-chunk', (data: { sessionId: string; chunk: Buffer; timestamp: number }) => {
      const { sessionId, chunk, timestamp } = data

      io.to(`session-${sessionId}`).emit('audio-received', {
        sessionId,
        chunk,
        timestamp,
      })
    })

    socket.on('get-suggestion', (data: { sessionId: string; transcript: string }) => {
      const { sessionId, transcript } = data
      const session = activeSessions.get(sessionId)

      if (session) {
        // In production, would call generateClinicalSuggestions here
        io.to(`session-${sessionId}`).emit('suggestion-generated', {
          sessionId,
          suggestions: [
            'Consider checking vital signs',
            'Review patient history for similar presentations',
            'Order relevant laboratory tests',
          ],
        })
      }
    })

    socket.on('start-recording', (data: { sessionId: string }) => {
      const { sessionId } = data
      const session = activeSessions.get(sessionId)

      if (session) {
        session.isRecording = true
        io.to(`session-${sessionId}`).emit('recording-started', { sessionId })
      }
    })

    socket.on('stop-recording', (data: { sessionId: string }) => {
      const { sessionId } = data
      const session = activeSessions.get(sessionId)

      if (session) {
        session.isRecording = false
        io.to(`session-${sessionId}`).emit('recording-stopped', { sessionId })
      }
    })

    // Session note update
    socket.on('session-note', (data: { sessionId: string; note: string }) => {
      const { sessionId, note } = data

      io.to(`session-${sessionId}`).emit('note-updated', {
        sessionId,
        note,
      })
    })

    socket.on('end-session', (data: { sessionId: string }) => {
      const { sessionId } = data
      const session = activeSessions.get(sessionId)

      if (session) {
        const duration = Date.now() - session.startTime

        io.to(`session-${sessionId}`).emit('session-ending', {
          sessionId,
          duration,
          transcript: session.transcript.join('\n'),
        })

        // Clean up
        activeSessions.delete(sessionId)
        socket.leave(`session-${sessionId}`)
      }
    })

    socket.on('disconnect', () => {
      console.log('[v0] WebSocket client disconnected:', socket.id)

      for (const [sessionId, session] of activeSessions.entries()) {
        const index = session.clientIds.indexOf(socket.id)
        if (index > -1) {
          session.clientIds.splice(index, 1)

          if (session.clientIds.length === 0) {
            activeSessions.delete(sessionId)
          } else {
            io.to(`session-${sessionId}`).emit('participant-left', {
              sessionId,
              participantCount: session.clientIds.length,
            })
          }
        }
      }
    })

    // Error handling
    socket.on('error', error => {
      console.error('[v0] WebSocket error:', error)
    })
  })

  return io
}

/**
 * Get active session state
 */
export function getSessionState(sessionId: string): SessionState | undefined {
  return activeSessions.get(sessionId)
}

/**
 * Broadcast message to session
 */
export function broadcastToSession(
  io: SocketIOServer,
  sessionId: string,
  event: string,
  data: any
) {
  io.to(`session-${sessionId}`).emit(event, data)
}

/**
 * Get all active sessions
 */
export function getActiveSessions(): SessionState[] {
  return Array.from(activeSessions.values())
}

/**
 * End session and cleanup
 */
export function closeSession(sessionId: string) {
  activeSessions.delete(sessionId)
}
