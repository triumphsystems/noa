'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AudioRecorderControl } from '@/components/session/audio-recorder-control'
import { TranscriptFeed, type TranscriptItem } from '@/components/session/transcript-feed'
import { ClinicalSuggestionsFeed, type ClinicalSuggestionItem } from '@/components/session/clinical-suggestions-feed'
import { SoapNoteCard, type SOAPNoteData } from '@/components/session/soap-note-card'
import { useDoctorStore } from '@/lib/stores/doctor.store'

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

  const doctorId = useDoctorStore(state => state.doctorId)
  const patients = useDoctorStore(state => state.patients)
  const loadDashboard = useDoctorStore(state => state.loadDashboard)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const chunkIndexRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const latestSpeechRef = useRef<string>('')
  const transcriptsRef = useRef<TranscriptItem[]>([])

  useEffect(() => {
    transcriptsRef.current = transcripts
  }, [transcripts])

  // Ensure doctor data is loaded
  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedDoctorId = window.localStorage.getItem('doctorId') || doctorId
    if (storedDoctorId && patients.length === 0) {
      void loadDashboard(storedDoctorId)
    }
  }, [doctorId, patients.length, loadDashboard])

  // Cleanup timer & audio stream on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const getAISuggestions = async (transcript: string, activeSessionId?: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/clinical/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, sessionId: activeSessionId || sessionId }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.suggestions && data.suggestions.length > 0) {
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

  const generateSOAPNote = useCallback(async (currentTranscripts: TranscriptItem[], activeSessionId?: string) => {
    setIsGenerating(true)
    try {
      const fullTranscript = currentTranscripts
        .filter(t => t.role !== 'system')
        .map(t => `${t.role}: ${t.text}`)
        .join('\n')

      if (!fullTranscript.trim()) return

      const response = await fetch('/api/clinical/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: fullTranscript,
          sessionId: activeSessionId || sessionId,
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

  const uploadAudioChunk = async (chunk: Blob, currentSessionId: string, currentChunkIndex: number) => {
    const formData = new FormData()
    formData.append('audio', chunk, `chunk-${currentChunkIndex}.webm`)
    formData.append('sessionId', currentSessionId)
    formData.append('doctorId', doctorId || (typeof window !== 'undefined' ? window.localStorage.getItem('doctorId') || '' : ''))
    formData.append('patientId', selectedPatient)
    formData.append('chunkIndex', currentChunkIndex.toString())
    formData.append('clientTranscript', latestSpeechRef.current)
    latestSpeechRef.current = ''

    try {
      const res = await fetch('/api/sessions/voice', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        // If the browser speech recognition missed speech but Bedrock Nova Sonic transcribed it, append it
        if (data.chunkTranscript && data.chunkTranscript.trim() && !recognitionRef.current) {
          const now = new Date()
          setTranscripts(prev => [
            ...prev,
            {
              role: 'patient',
              text: data.chunkTranscript.trim(),
              timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            },
          ])
        }

        // Live clinical suggestions from Bedrock Nova
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(
            data.suggestions.map((text: string, idx: number) => ({
              text,
              priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
            }))
          )
        }
      }
    } catch (err) {
      console.warn(`[Rolling Audio] Chunk ${currentChunkIndex} upload warning:`, err)
    }
  }

  const startRecording = async () => {
    try {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      setSessionId(newSessionId)
      chunkIndexRef.current = 0

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream

      // Configure rolling 10-second incremental timeslices
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          const currentIndex = chunkIndexRef.current++
          void uploadAudioChunk(event.data, newSessionId, currentIndex)
        }
      }

      mediaRecorder.onstop = () => {
        void generateSOAPNote(transcriptsRef.current, newSessionId)
      }

      // Start with 10-second rolling interval (small ~150KB chunks safe for serverless)
      mediaRecorder.start(10000)
      setIsRecording(true)
      setSessionDuration(0)

      // Start Web Speech API for instantaneous zero-latency UI transcription
      if (typeof window !== 'undefined') {
        const Win = window as any
        const SpeechRecognitionCtor = Win.SpeechRecognition || Win.webkitSpeechRecognition
        if (SpeechRecognitionCtor) {
          try {
            const recognition = new SpeechRecognitionCtor()
            recognition.continuous = true
            recognition.interimResults = false
            recognition.lang = 'en-US'

            recognition.onresult = (event: any) => {
              const lastResult = event.results[event.results.length - 1]
              if (lastResult && lastResult[0]?.transcript) {
                const text = lastResult[0].transcript.trim()
                if (text) {
                  latestSpeechRef.current = text
                  const now = new Date()
                  setTranscripts(prev => [
                    ...prev,
                    {
                      role: 'patient',
                      text,
                      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    },
                  ])

                  if (text.length > 20) {
                    void getAISuggestions(text, newSessionId)
                  }
                }
              }
            }

            recognition.onerror = (err: any) => {
              console.warn('[Web Speech] Recognition error:', err)
            }

            recognition.start()
            recognitionRef.current = recognition
          } catch (speechErr) {
            console.warn('[Web Speech] Could not start speech recognition:', speechErr)
          }
        }
      }

      timerRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1)
      }, 1000)

      const now = new Date()
      setTranscripts(prev => [
        ...prev,
        {
          role: 'system',
          text: 'Session started — Nova AI rolling audio capture & real-time clinical intelligence active.',
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

      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
        recognitionRef.current = null
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
      }

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      const now = new Date()
      setTranscripts(prev => [
        ...prev,
        {
          role: 'system',
          text: 'Recording stopped. Synthesizing consultation summary and final SOAP note.',
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
      const activeDoctorId =
        doctorId || (typeof window !== 'undefined' ? window.localStorage.getItem('doctorId') || '' : '')

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          doctorId: activeDoctorId,
          patientId: selectedPatient,
          transcript: transcripts.filter(t => t.role !== 'system').map(t => `${t.role}: ${t.text}`).join('\n'),
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-1 text-deep-ink">New Consultation</h1>
        <p className="text-slate text-xs sm:text-sm">
          Voice-guided session with real-time AI transcription & clinical SOAP note generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Main Recording & Transcript Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Selector */}
          <Card className="p-5 sm:p-6 bg-white border border-deep-ink/8 shadow-editorial font-sans">
            <label className="block text-xs font-medium text-deep-ink mb-1.5">
              Select Patient Record
            </label>
            <select
              value={selectedPatient}
              onChange={e => setSelectedPatient(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-lg text-deep-ink focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 bg-white text-xs sm:text-sm shadow-2xs transition-colors cursor-pointer"
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
