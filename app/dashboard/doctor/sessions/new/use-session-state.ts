import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import io from 'socket.io-client'

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

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useSessionState() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [sessionDuration, setSessionDuration] = useState(0)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [doctorId, setDoctorId] = useState('')
  const [sessionId, setSessionId] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setDoctorId(localStorage.getItem('doctorId') || 'doctor-demo')
  }, [])

  const { data: patientsData } = useSWR(
    doctorId ? `/api/patients?doctorId=${doctorId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  useEffect(() => {
    const socket = io('http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    socket.on('suggestion-generated', (data: { suggestions: string[] }) => {
      setSuggestions(
        data.suggestions.map((text, idx) => ({
          text,
          priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
        }))
      )
      setIsGenerating(false)
    })

    socket.on('transcript-updated', (data: { newLine: string }) => {
      const now = new Date()
      setTranscripts(prev => [...prev, { role: 'patient', text: data.newLine, timestamp: now.toLocaleTimeString() }])
    })

    return () => socket.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const patients = patientsData?.patients || []

  return {
    isRecording,
    setIsRecording,
    transcripts,
    setTranscripts,
    soapNote,
    setSoapNote,
    selectedPatient,
    setSelectedPatient,
    sessionDuration,
    setSessionDuration,
    suggestions,
    setSuggestions,
    isGenerating,
    setIsGenerating,
    doctorId,
    sessionId,
    setSessionId,
    mediaRecorderRef,
    timerRef,
    patients,
  }
}
