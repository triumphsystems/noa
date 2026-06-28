'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import io, { Socket } from 'socket.io-client'
import useSWR from 'swr'

interface Transcript {
  role: 'doctor' | 'patient' | 'system' | 'ai'
  text: string
  timestamp: string
}

interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface ClinicalSuggestion {
  text: string
  priority: 'high' | 'medium' | 'low'
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function NewSessionPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [sessionDuration, setSessionDuration] = useState(0)
  const [suggestions, setSuggestions] = useState<ClinicalSuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [doctorId, setDoctorId] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [socket, setSocket] = useState<Socket | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch doctor's patients
  useEffect(() => {
    const storedDoctorId = localStorage.getItem('doctorId') || 'doctor-demo'
    setDoctorId(storedDoctorId)
  }, [])

  const { data: patientsData } = useSWR(
    doctorId ? `/api/patients?doctorId=${doctorId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const patients = patientsData?.patients || []

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      console.log('[v0] Connected to WebSocket')
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
          timestamp: now.toLocaleTimeString(),
        },
      ])

      // Request suggestions from Nova
      if (data.newLine.length > 20) {
        getAISuggestions(data.newLine)
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  // Cleanup timer
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
        body: JSON.stringify({
          transcript,
          sessionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(
          data.suggestions.map((text: string, idx: number) => ({
            text,
            priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
          }))
        )
      }
    } catch (error) {
      console.error('[v0] Error getting suggestions:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSOAPNote = async () => {
    setIsGenerating(true)
    try {
      const fullTranscript = transcripts.map(t => `${t.role}: ${t.text}`).join('\n')

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
      console.error('[v0] Error generating SOAP note:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const startRecording = async () => {
    try {
      // Create new session
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)

      // Join WebSocket session
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

        // Send audio chunk via WebSocket
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

        // Generate SOAP note with Nova
        await generateSOAPNote()

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setSessionDuration(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1)
      }, 1000)

      // Add system message
      const now = new Date()
      setTranscripts(prev => [
        ...prev,
        {
          role: 'system',
          text: 'Session started - Nova AI monitoring consultation',
          timestamp: now.toLocaleTimeString(),
        },
      ])
    } catch (error) {
      console.error('[v0] Error accessing microphone:', error)
      alert('Unable to access microphone. Please check permissions.')
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
          text: 'Recording stopped',
          timestamp: now.toLocaleTimeString(),
        },
      ])
    }
  }

  const simulateTranscription = () => {
    // Simulate receiving transcribed text
    const sampleTranscripts: Transcript[] = [
      {
        role: 'doctor',
        text: "Good morning. How are you feeling today? What brings you in?",
        timestamp: new Date(Date.now() + 1000).toLocaleTimeString(),
      },
      {
        role: 'patient',
        text: "I've been experiencing headaches for the past week. They usually start in the morning and last about 3 hours.",
        timestamp: new Date(Date.now() + 3000).toLocaleTimeString(),
      },
      {
        role: 'doctor',
        text: "I see. On a scale of 1 to 10, how severe are the headaches? And have you taken any medication?",
        timestamp: new Date(Date.now() + 5000).toLocaleTimeString(),
      },
    ]

    // Add transcripts gradually
    sampleTranscripts.forEach((transcript, idx) => {
      setTimeout(() => {
        setTranscripts(prev => [...prev, transcript])
      }, idx * 2000)
    })

    // Simulate SOAP note generation
    setTimeout(() => {
      setSoapNote({
        subjective: 'Patient reports morning headaches lasting approximately 3 hours, occurring daily for the past week. Severity rated 6/10.',
        objective: 'Patient appears well-oriented and alert. No visible signs of distress. Vital signs within normal limits.',
        assessment: 'Primary headache disorder, likely tension-type or migraine headache. Initial presentation.',
        plan: 'Recommend trial of OTC pain relief medication. Maintain headache diary. Follow-up appointment in 1 week if symptoms persist. Consider neurological referral if no improvement.',
      })
    }, 8000)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleSaveSession = async () => {
    if (!selectedPatient || transcripts.length === 0) {
      alert('Please select a patient and ensure recording has text.')
      return
    }

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
        alert('Session saved successfully!')
        // Reset form
        setTranscripts([])
        setSoapNote(null)
        setSelectedPatient('')
      }
    } catch (error) {
      console.error('[v0] Error saving session:', error)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">New Session</h1>
          <p className="text-slate">Start a voice consultation with your patient</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold font-serif text-hi-yellow">{formatDuration(sessionDuration)}</div>
          <p className="text-slate text-sm">Session Duration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Recording Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Selection */}
          <div className="bg-white rounded-3xl p-6 border border-deep-ink/10">
            <label className="block text-sm font-semibold text-deep-ink mb-3">Select Patient</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-3 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
            >
              <option value="">Choose a patient...</option>
              {patients.map((patient: any) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Recording Controls */}
          <div className="bg-gradient-to-br from-soft-meadow to-soft-meadow/50 rounded-3xl p-8 border-2 border-hi-yellow/20">
            <div className="flex items-center justify-center mb-6">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  isRecording ? 'bg-hi-yellow animate-pulse' : 'bg-soft-meadow'
                } border-2 border-deep-ink/20`}
              >
                <svg className="w-10 h-10 text-deep-ink" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-slate text-sm mb-2">
                {isRecording ? 'Recording in progress...' : 'Ready to record'}
              </p>
              <p className="text-2xl font-bold text-deep-ink">{formatDuration(sessionDuration)}</p>
            </div>

            <div className="flex gap-4 justify-center">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={!selectedPatient}
                  className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8 py-3"
                >
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="rounded-full bg-red-500 text-white hover:bg-red-600 px-8 py-3"
                >
                  Stop Recording
                </Button>
              )}
            </div>
          </div>

          {/* Transcript */}
          {transcripts.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-deep-ink/10">
              <h3 className="text-lg font-semibold font-serif mb-4">Live Transcript</h3>
              <div className="h-64 overflow-y-auto space-y-3 bg-soft-meadow/30 rounded-2xl p-4">
                {transcripts.map((transcript, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          transcript.role === 'doctor'
                            ? 'bg-hi-yellow text-deep-ink'
                            : transcript.role === 'patient'
                              ? 'bg-moss-green/20 text-deep-ink'
                              : 'bg-slate/20 text-slate'
                        }`}
                      >
                        {transcript.role === 'doctor' ? 'Doctor' : transcript.role === 'patient' ? 'Patient' : 'System'}
                      </span>
                      <span className="text-xs text-slate">{transcript.timestamp}</span>
                    </div>
                    <p className="text-deep-ink ml-2">{transcript.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Suggestions & SOAP Note */}
        <div className="space-y-4">
          {/* Nova Clinical Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-gradient-to-br from-moss-green/10 to-fuchsia/10 rounded-3xl p-6 border border-deep-ink/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-moss-green rounded-full animate-pulse" />
                <h3 className="text-lg font-semibold font-serif">Nova AI Suggestions</h3>
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-3 border-l-4 border-moss-green">
                    <p className="text-sm text-deep-ink">{suggestion.text}</p>
                    <span
                      className={`inline-block text-xs font-medium mt-2 px-2 py-1 rounded-full ${
                        suggestion.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : suggestion.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {suggestion.priority} priority
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOAP Note Preview */}
          <div className="bg-white rounded-3xl p-6 border border-deep-ink/10 sticky top-32">
            <h3 className="text-lg font-semibold font-serif mb-4">SOAP Note Preview</h3>

            {soapNote ? (
              <div className="space-y-4 text-sm max-h-96 overflow-y-auto">
                <div>
                  <h4 className="font-semibold text-deep-ink mb-1">Subjective</h4>
                  <p className="text-slate text-xs leading-relaxed">{soapNote.subjective}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-deep-ink mb-1">Objective</h4>
                  <p className="text-slate text-xs leading-relaxed">{soapNote.objective}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-deep-ink mb-1">Assessment</h4>
                  <p className="text-slate text-xs leading-relaxed">{soapNote.assessment}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-deep-ink mb-1">Plan</h4>
                  <p className="text-slate text-xs leading-relaxed">{soapNote.plan}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate text-sm text-center py-8">
                SOAP note will appear here after recording completes
              </p>
            )}
          </div>

          {/* Save Button */}
          {soapNote && (
            <Button
              onClick={handleSaveSession}
              className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 py-3 font-semibold"
            >
              Save Session
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
