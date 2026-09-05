'use client'

import { useState, useRef, useEffect, useCallback, Suspense, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AudioRecorderControl } from '@/components/session/audio-recorder-control'
import { TranscriptFeed, type TranscriptItem } from '@/components/session/transcript-feed'
import { ClinicalSuggestionsFeed, type ClinicalSuggestionItem } from '@/components/session/clinical-suggestions-feed'
import { SoapNoteCard, type SOAPNoteData } from '@/components/session/soap-note-card'
import { useDoctorStore } from '@/lib/stores/doctor.store'
import { ArrowLeft, User, CheckCircle2, ShieldAlert } from 'lucide-react'

function SessionPageContent() {
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get('patientId') || ''

  const [isRecording, setIsRecording] = useState(false)
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([])
  const [soapNote, setSoapNote] = useState<SOAPNoteData | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<string>(initialPatientId)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [suggestions, setSuggestions] = useState<ClinicalSuggestionItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [saveSuccess, setSaveSuccess] = useState(false)

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

  // Sync initial query param if present
  useEffect(() => {
    if (initialPatientId && !selectedPatient) {
      setSelectedPatient(initialPatientId)
    }
  }, [initialPatientId, selectedPatient])

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

  const activePatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatient) || null
  }, [patients, selectedPatient])

  const activePatientName = useMemo(() => {
    if (!activePatient) return ''
    const parts = [activePatient.firstName, activePatient.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : (activePatient.email || `Patient #${activePatient.id.slice(-6)}`)
  }, [activePatient])

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
    if (!selectedPatient) {
      alert('Please select a patient record first.')
      return
    }

    try {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      setSessionId(newSessionId)
      chunkIndexRef.current = 0
      setSaveSuccess(false)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream

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

      mediaRecorder.start(10000)
      setIsRecording(true)
      setSessionDuration(0)

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
          text: `Consultation started with ${activePatientName || 'Patient'}. Bedrock Nova AI clinical streaming active.`,
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
          text: 'Recording finished. Amazon Bedrock Nova is synthesizing the structured SOAP note and clinical assessment.',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ])
    }
  }

  const handleSaveSession = async (customNote?: SOAPNoteData) => {
    if (!selectedPatient || transcripts.length === 0) {
      alert('Please ensure a patient is selected and transcript data has been captured.')
      return
    }

    const noteToSave = customNote || soapNote

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
          soapNote: noteToSave,
          duration: sessionDuration,
        }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        if (doctorId) {
          void loadDashboard(doctorId)
        }
      } else {
        alert('Failed to save session record. Please try again.')
      }
    } catch (error) {
      console.error('Error saving session:', error)
      alert('Error connecting to session API.')
    } finally {
      setIsSaving(false)
    }
  }

  const resetForNewSession = () => {
    setTranscripts([])
    setSoapNote(null)
    setSuggestions([])
    setSessionDuration(0)
    setSessionId('')
    setSaveSuccess(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate mb-1">
          <Link
            href="/dashboard/doctor"
            className="hover:text-deep-ink flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span>/</span>
          {activePatient ? (
            <Link
              href={`/dashboard/doctor/patients/${activePatient.id}`}
              className="hover:text-deep-ink transition-colors truncate max-w-xs"
            >
              {activePatientName}
            </Link>
          ) : (
            <span className="text-deep-ink">Consultation</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-deep-ink">
              Clinical Voice Consultation
            </h1>
            <p className="text-slate text-xs sm:text-sm">
              Live doctor-patient encounter with ambient speech recognition, clinical guidance, and automated SOAP documentation
            </p>
          </div>

          {activePatient && (
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/doctor/patients/${activePatient.id}`}>
                <Button variant="outline" size="sm" className="rounded-full text-xs font-medium gap-1.5 cursor-pointer">
                  <User className="w-3.5 h-3.5" />
                  View Patient Chart
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-xs sm:text-sm">Consultation Record Saved Successfully!</p>
              <p className="text-xs text-emerald-800">
                The SOAP note and dialogue transcript have been archived to {activePatientName}&apos;s clinical chart.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={resetForNewSession}
              size="sm"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
            >
              Start Another Session
            </Button>
            {activePatient && (
              <Link href={`/dashboard/doctor/patients/${activePatient.id}`}>
                <Button variant="outline" size="sm" className="rounded-full text-xs cursor-pointer border-emerald-300">
                  Open Patient Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Patient Selection & Clinical Context Card */}
      <Card className="p-5 sm:p-6 bg-white border border-deep-ink/8 shadow-editorial">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate">
              Selected Patient Record
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedPatient}
                onChange={e => {
                  setSelectedPatient(e.target.value)
                  setSaveSuccess(false)
                }}
                disabled={isRecording}
                className="w-full sm:w-80 px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow bg-white text-xs sm:text-sm shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
              >
                <option value="">Select a patient from your registry...</option>
                {patients.map(p => {
                  const pName = [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || `Patient #${p.id.slice(-6)}`
                  return (
                    <option key={p.id} value={p.id}>
                      {pName} ({p.email || p.id.slice(0, 8)})
                    </option>
                  )
                })}
              </select>

              {activePatient && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    ID: {activePatient.id.slice(0, 8)}...
                  </Badge>
                  {activePatient.linkStatus === 'pending_patient_approval' && (
                    <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-800 border-amber-200">
                      Pending Consent
                    </Badge>
                  )}
                  {activePatient.linkStatus === 'linked' && (
                    <Badge variant="success" className="text-xs">
                      Practice Connected
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {activePatient && (
            <div className="flex items-center gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-deep-ink/10 text-xs">
              <div>
                <span className="text-slate block text-[11px]">Date of Birth</span>
                <span className="font-semibold text-deep-ink">{activePatient.dateOfBirth || '—'}</span>
              </div>
              <div className="h-6 w-px bg-deep-ink/10 hidden sm:block" />
              <div>
                <span className="text-slate block text-[11px]">Gender</span>
                <span className="font-semibold text-deep-ink capitalize">{activePatient.gender || '—'}</span>
              </div>
              <div className="h-6 w-px bg-deep-ink/10 hidden sm:block" />
              <div>
                <span className="text-slate block text-[11px]">Conditions</span>
                <span className="font-semibold text-deep-ink">
                  {activePatient.conditions?.length || 0} active
                </span>
              </div>
            </div>
          )}
        </div>

        {activePatient && (activePatient.conditions?.length || activePatient.allergies?.length) ? (
          <div className="mt-4 pt-4 border-t border-deep-ink/8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {activePatient.conditions && activePatient.conditions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate font-medium">History:</span>
                {activePatient.conditions.map((cond, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-soft-meadow text-deep-ink text-[11px]">
                    {cond}
                  </span>
                ))}
              </div>
            )}
            {activePatient.allergies && activePatient.allergies.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-rose-700 font-medium flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Allergies:
                </span>
                {activePatient.allergies.map((allergy, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">
                    {allergy}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Card>

      {/* Primary Audio Recording Console */}
      <AudioRecorderControl
        isRecording={isRecording}
        sessionDuration={sessionDuration}
        selectedPatient={selectedPatient}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      {/* Balanced 2-Column Clinical Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Left Column: Real-Time Consultation Dialogue */}
        <div className="space-y-6">
          <TranscriptFeed transcripts={transcripts} isRecording={isRecording} />
        </div>

        {/* Right Column: Real-time Copilot & Synthesized SOAP Documentation */}
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
            onUpdateNote={setSoapNote}
          />
        </div>
      </div>
    </div>
  )
}

export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate text-sm max-w-5xl mx-auto">
          Loading consultation console...
        </div>
      }
    >
      <SessionPageContent />
    </Suspense>
  )
}
