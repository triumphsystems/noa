'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import io, { Socket } from 'socket.io-client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AudioRecorderControl } from '@/components/session/audio-recorder-control'
import { TranscriptFeed, type TranscriptItem } from '@/components/session/transcript-feed'
import { ClinicalSuggestionsFeed, type ClinicalSuggestionItem } from '@/components/session/clinical-suggestions-feed'
import { SoapNoteCard, type SOAPNoteData } from '@/components/session/soap-note-card'
import { useDoctorDashboardStore } from '@/lib/stores/doctor-dashboard-store'

export default function NewSessionPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([])
  const [soapNote, setSoapNote] = useState<SOAPNoteData | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [sessionDuration, setSessionDuration] = useState(0)
  const [suggestions, setSuggestions] = useState<ClinicalSuggestionItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [socket, setSocket] = useState<Socket | null>(null)

  const doctorId = useDoctorDashboardStore(state => state.doctorId)
  const patients = useDoctorDashboardStore(state => state.patients)
  const loadDashboard = useDoctorDashboardStore(state => state.loadDashboard)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Ensure doctor data is loaded
  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedDoctorId = window.localStorage.getItem('doctorId') || doctorId
    if (storedDoctorId && patients.length === 0) {
      void loadDashboard(storedDoctorId)
    }
  }, [doctorId, patients.length, loadDashboard])

  // Initialize WebSocket connection safely
  useEffect(() => {
    if (typeof window === 'undefined') return
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || window.location.origin
    const newSocket = io(wsUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3,
    })

    newSocket.on('suggestion-generated', (data: { suggestions: string[] }) => {
      setSuggestions(
        data.suggestions.map((text, idx) => ({
          text,
          priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
        }))
      )
      setIsGenerating(false)
    })

    newSocket.on('transcript-updated', (data: { newLine: string }) => {
      const now = new Date()
      setTranscripts(prev => [
        ...prev,
        {
          role: 'patient',
          text: data.newLine,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ])

      if (data.newLine.length > 20) {
        void getAISuggestions(data.newLine)
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const getAISuggestions = async (transcript: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/clinical/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, sessionId }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.suggestions) {
          setSuggestions(
            data.suggestions.map((text: string, idx: number) => ({
              text,
              priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
            }))
          )
        }
      }
    } catch (error) {
      console.error('Error fetching clinical suggestions:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSOAPNote = useCallback(async (currentTranscripts: TranscriptItem[]) => {
    setIsGenerating(true)
    try {
      const fullTranscript = currentTranscripts.map(t => `${t.role}: ${t.text}`).join('\n')

      const response = await fetch('/api/clinical/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: fullTranscript,
          sessionId,
          patientId: selectedPatient,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSoapNote(data.soapNote)
      }
    } catch (error) {
      console.error('Error generating SOAP note:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [sessionId, selectedPatient])

  const startRecording = async () => {
    try {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      setSessionId(newSessionId)

      if (socket) {
        socket.emit('join-session', {
          sessionId: newSessionId,
          userId: doctorId,
          userType: 'doctor',
        })
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
        if (socket) {
          socket.emit('audio-chunk', {
            sessionId: newSessionId,
            chunk: event.data,
            timestamp: Date.now(),
          })
        }
      }

      mediaRecorder.onstop = async () => {
        audioChunksRef.current = []
        await generateSOAPNote(transcripts)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setSessionDuration(0)

      timerRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1)
      }, 1000)

      const now = new Date()
      setTranscripts(prev => [
        ...prev,
        {
          role: 'system',
          text: 'Session started — Nova AI real-time transcription active.',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ])
    } catch (error) {
      console.error('Microphone access error:', error)
      alert('Unable to access microphone. Please check your browser audio permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      const now = new Date()
      setTranscripts(prev => [
        ...prev,
        {
          role: 'system',
          text: 'Recording stopped. Synthesizing consultation summary.',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ])
    }
  }

  const simulateTranscription = () => {
    const sampleTranscripts: TranscriptItem[] = [
      {
        role: 'doctor',
        text: 'Good morning. How are you feeling today? What symptoms brought you in?',
        timestamp: new Date(Date.now() + 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      {
        role: 'patient',
        text: "I've been experiencing persistent headaches in the morning for the past week, lasting about 3 hours each time.",
        timestamp: new Date(Date.now() + 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      {
        role: 'doctor',
        text: 'I see. On a scale of 1 to 10, how severe is the throbbing? Any sensitivity to bright lights?',
        timestamp: new Date(Date.now() + 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    ]

    sampleTranscripts.forEach((item, idx) => {
      setTimeout(() => {
        setTranscripts(prev => [...prev, item])
      }, idx * 1500)
    })

    setSuggestions([
      { text: 'Check for photophobia or visual aura indicators', priority: 'high' },
      { text: 'Assess screen time, sleep rhythm, and hydration patterns', priority: 'medium' },
      { text: 'Review family history of migraines or hypertension', priority: 'low' },
    ])

    setTimeout(() => {
      setSoapNote({
        subjective: 'Patient reports recurring morning headaches lasting ~3 hours daily for 1 week. Rates severity at 6/10.',
        objective: 'Alert and oriented x3. Cranial nerves intact. No visible signs of acute distress. Vitals stable.',
        assessment: 'Primary headache disorder, likely episodic tension-type or early migraine presentation.',
        plan: 'Trial of OTC analgesics as needed. Maintain a 14-day headache diary. Schedule follow-up in 2 weeks.',
      })
    }, 5500)
  }

  const handleSaveSession = async () => {
    if (!selectedPatient || transcripts.length === 0) {
      alert('Please select a patient and ensure the session has transcript data.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient,
          transcripts,
          soapNote,
          duration: sessionDuration,
        }),
      })

      if (response.ok) {
        alert('Consultation session saved successfully!')
        setTranscripts([])
        setSoapNote(null)
        setSelectedPatient('')
        setSuggestions([])
        setSessionDuration(0)
      } else {
        alert('Failed to save session. Please try again.')
      }
    } catch (error) {
      console.error('Error saving session:', error)
      alert('Error connecting to session API.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-serif mb-1 text-deep-ink">New Consultation</h1>
        <p className="text-slate text-sm">
          Voice-guided session with real-time AI transcription & clinical SOAP note generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Recording & Transcript Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Selector */}
          <Card className="p-6">
            <label className="block text-sm font-semibold text-deep-ink mb-2">
              Select Patient Record
            </label>
            <select
              value={selectedPatient}
              onChange={e => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-3 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow bg-transparent text-sm"
            >
              <option value="">Choose a patient...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} ({patient.email})
                </option>
              ))}
            </select>
          </Card>

          {/* Recorder Controls */}
          <AudioRecorderControl
            isRecording={isRecording}
            sessionDuration={sessionDuration}
            selectedPatient={selectedPatient}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onSimulate={simulateTranscription}
          />

          {/* Transcript Feed */}
          <TranscriptFeed transcripts={transcripts} />
        </div>

        {/* AI Guidance & SOAP Note Sidebar */}
        <div className="space-y-6">
          <ClinicalSuggestionsFeed
            suggestions={suggestions}
            isGenerating={isGenerating}
          />

          <SoapNoteCard
            soapNote={soapNote}
            isGenerating={isGenerating}
            isSaving={isSaving}
            onSave={handleSaveSession}
          />
        </div>
      </div>
    </div>
  )
}
