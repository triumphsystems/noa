'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Transcript {
  role: 'doctor' | 'patient' | 'system'
  text: string
  timestamp: string
}

interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export default function NewSessionPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [sessionDuration, setSessionDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Mock patients
  const mockPatients = [
    { id: '1', name: 'John Doe', lastVisit: '2 weeks ago' },
    { id: '2', name: 'Jane Smith', lastVisit: '1 month ago' },
    { id: '3', name: 'Robert Johnson', lastVisit: '3 days ago' },
  ]

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []

        // Simulate transcription
        simulateTranscription()

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
          text: 'Recording started',
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
              {mockPatients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - Last visit: {patient.lastVisit}
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

        {/* SOAP Note Preview */}
        <div className="space-y-4">
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
