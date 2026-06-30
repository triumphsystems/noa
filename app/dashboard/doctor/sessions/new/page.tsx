'use client'

import { useSessionState } from './use-session-state'
import { SessionPatientSelect } from './session-patient-select'
import { SessionRecordingControls } from './session-recording-controls'
import { SessionTranscriptDisplay } from './session-transcript-display'
import { SessionSOAPPreview } from './session-soap-preview'
import { SessionSuggestions } from './session-suggestions'

export default function NewSessionPage() {
  const state = useSessionState()

  const startRecording = async () => {
    try {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      state.setSessionId(newSessionId)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.onstop = async () => {
        await generateSOAPNote()
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      state.mediaRecorderRef.current = mediaRecorder
      state.setIsRecording(true)
      state.setSessionDuration(0)

      state.timerRef.current = setInterval(() => {
        state.setSessionDuration(prev => prev + 1)
      }, 1000)

      const now = new Date()
      state.setTranscripts(prev => [
        ...prev,
        { role: 'system', text: 'Session started', timestamp: now.toLocaleTimeString() },
      ])
    } catch (error) {
      console.error('[v0] Error:', error)
      alert('Unable to access microphone.')
    }
  }

  const stopRecording = () => {
    if (state.mediaRecorderRef.current && state.isRecording) {
      state.mediaRecorderRef.current.stop()
      state.setIsRecording(false)
      if (state.timerRef.current) clearInterval(state.timerRef.current)
    }
  }

  const generateSOAPNote = async () => {
    state.setIsGenerating(true)
    try {
      const fullTranscript = state.transcripts.map(t => `${t.role}: ${t.text}`).join('\n')
      const response = await fetch('/api/clinical/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullTranscript, sessionId: state.sessionId, patientId: state.selectedPatient }),
      })

      if (response.ok) {
        const data = await response.json()
        state.setSoapNote(data.soapNote)
      }
    } catch (error) {
      console.error('[v0] Error:', error)
    } finally {
      state.setIsGenerating(false)
    }
  }

  const handleSaveSession = async () => {
    if (!state.selectedPatient || state.transcripts.length === 0) {
      alert('Select patient and ensure recording has text.')
      return
    }

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: state.selectedPatient, transcripts: state.transcripts, soapNote: state.soapNote, duration: state.sessionDuration }),
      })

      if (response.ok) {
        alert('Session saved!')
        state.setTranscripts([])
        state.setSoapNote(null)
        state.setSelectedPatient('')
      }
    } catch (error) {
      console.error('[v0] Error:', error)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">New Session</h1>
          <p className="text-slate">Start a voice consultation</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold font-serif text-hi-yellow">
            {String(Math.floor(state.sessionDuration / 60)).padStart(2, '0')}:
            {String(state.sessionDuration % 60).padStart(2, '0')}
          </div>
          <p className="text-slate text-sm">Duration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <SessionPatientSelect selectedPatient={state.selectedPatient} onSelect={state.setSelectedPatient} patients={state.patients} />
          <SessionRecordingControls
            isRecording={state.isRecording}
            isSubmitting={state.isGenerating}
            sessionDuration={state.sessionDuration}
            onStart={startRecording}
            onStop={stopRecording}
          />
          <SessionTranscriptDisplay transcripts={state.transcripts} />
        </div>

        <div className="space-y-4">
          <SessionSuggestions suggestions={state.suggestions} />
          <SessionSOAPPreview soapNote={state.soapNote} isGenerating={state.isGenerating} onSave={handleSaveSession} />
        </div>
      </div>
    </div>
  )
}
