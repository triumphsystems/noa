'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { IntakeConversationDraft, IntakeConversationMessage } from '@/lib/voice-service'

function mapLanguageToBcp47(langName: string): string {
  const normalized = (langName || '').toLowerCase()
  if (normalized.includes('spanish') || normalized.includes('español')) return 'es-ES'
  if (normalized.includes('french') || normalized.includes('français')) return 'fr-FR'
  if (normalized.includes('german') || normalized.includes('deutsch')) return 'de-DE'
  if (normalized.includes('chinese') || normalized.includes('mandarin')) return 'zh-CN'
  if (normalized.includes('yoruba')) return 'yo-NG'
  if (normalized.includes('igbo')) return 'ig-NG'
  if (normalized.includes('hausa')) return 'ha-NG'
  if (normalized.includes('arabic')) return 'ar-SA'
  if (normalized.includes('portuguese')) return 'pt-BR'
  return 'en-US'
}

type IntakeTurn = {
  assistantMessage: string
  detectedLanguage: string
  normalizedTranscript: string
  draft: IntakeConversationDraft
  missingFields: string[]
  isComplete: boolean
  summary: string
}

export type ConversationEntry = {
  id: string
  role: 'assistant' | 'patient' | 'system'
  text: string
}

const initialDraft: IntakeConversationDraft = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  email: '',
  phone: '',
  address: '',
  medicalConditions: [],
  surgeries: '',
  allergies: [],
  currentMedications: [],
  familyHistory: '',
  smokingStatus: '',
  alcoholUse: '',
  exerciseFrequency: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  consentRead: false,
}

const initialPrompt =
  'Hi, I’m Noa. I’ll ask one short question at a time, and you can answer naturally in any language. I will listen, translate if needed, and keep the conversation moving.'

export function useIntakeVoice() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<number | null>(null)
  const isStartingRef = useRef(false)
  const isSubmittingRef = useRef(false)
  const committedTranscriptRef = useRef('')
  const lastSubmittedTranscriptRef = useRef('')
  const isCompleteRef = useRef(false)
  const isVoiceOutputRef = useRef(true)

  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [assistantMessage, setAssistantMessage] = useState(initialPrompt)
  const [detectedLanguage, setDetectedLanguage] = useState('English')
  const [draft, setDraft] = useState<IntakeConversationDraft>(initialDraft)
  const [history, setHistory] = useState<ConversationEntry[]>([
    { id: 'system-1', role: 'system', text: initialPrompt },
  ])
  const [error, setError] = useState('')
  const [transcriptPreview, setTranscriptPreview] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [patientId, setPatientId] = useState('')

  const chatItems = useMemo(() => history.filter((item) => item.role !== 'system'), [history])

  useEffect(() => {
    isCompleteRef.current = isComplete
  }, [isComplete])

  useEffect(() => {
    isVoiceOutputRef.current = isVoiceOutputEnabled
    if (!isVoiceOutputEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [isVoiceOutputEnabled])

  useEffect(() => {
    const resolvedDoctorId =
      searchParams?.get('doctorId') ||
      searchParams?.get('doctorCode') ||
      window.localStorage?.getItem('doctorId') ||
      ''
    const resolvedPatientId = searchParams?.get('patientId') || window.localStorage?.getItem('patientId') || ''
    setDoctorId(resolvedDoctorId)
    setPatientId(resolvedPatientId)
  }, [searchParams])

  const pushHistory = (role: ConversationEntry['role'], text: string) => {
    if (!text.trim()) return
    setHistory((prev) => [...prev, { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text }])
  }

  const speakMessage = (text: string, language: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !isVoiceOutputRef.current) return
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = mapLanguageToBcp47(language)
      utterance.rate = 0.95
      utterance.pitch = 1.0
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        if (!isCompleteRef.current) {
          setTimeout(() => { void startRecording() }, 400)
        }
      }
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    } catch {
      setIsSpeaking(false)
    }
  }

  const sendTranscript = async (transcript: string) => {
    const trimmed = transcript.trim()
    if (!trimmed || isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setError('')
    pushHistory('patient', trimmed)

    const outgoingHistory = [...history, { id: `patient-${Date.now()}`, role: 'patient' as const, text: trimmed }]

    try {
      const response = await fetch('/api/intakes/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: trimmed,
          language: detectedLanguage,
          history: outgoingHistory.map((item) => ({ role: item.role, content: item.text, timestamp: Date.now() })),
          draft,
          doctorId,
          patientId,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to process intake response')

      const nextTurn: IntakeTurn = data.turn
      const updatedDraft = nextTurn.draft || draft
      setDraft(updatedDraft)
      setAssistantMessage(nextTurn.assistantMessage)
      setDetectedLanguage(nextTurn.detectedLanguage || detectedLanguage)
      pushHistory('assistant', nextTurn.assistantMessage)
      speakMessage(nextTurn.assistantMessage, nextTurn.detectedLanguage || detectedLanguage)

      if (nextTurn.isComplete) {
        setIsComplete(true)
        sessionStorage.setItem(
          'intake-completion',
          JSON.stringify({
            summary: nextTurn.summary,
            draft: updatedDraft,
            language: nextTurn.detectedLanguage || detectedLanguage,
            doctorId,
            patientId,
          })
        )
        router.push('/intake/confirmation')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      pushHistory('assistant', 'I missed that. Please try again.')
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const startRecording = async () => {
    if (isStartingRef.current || isRecording || isSubmittingRef.current) return
    isStartingRef.current = true
    setError('')
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        stream.getTracks().forEach((track) => track.stop())
      })
      committedTranscriptRef.current = ''
      lastSubmittedTranscriptRef.current = ''
      setTranscriptPreview('')
      recognitionRef.current?.start()
      setIsRecording(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to access microphone')
      setIsRecording(false)
    } finally {
      isStartingRef.current = false
    }
  }

  const stopRecording = () => {
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current)
    recognitionRef.current?.stop()
    setIsRecording(false)
    setIsListening(false)
  }

  const toggleMic = () => {
    if (isRecording) stopRecording()
    else void startRecording()
  }

  const resetConversation = () => {
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current)
    recognitionRef.current?.stop()
    committedTranscriptRef.current = ''
    lastSubmittedTranscriptRef.current = ''
    setDraft(initialDraft)
    setHistory([{ id: 'system-1', role: 'system', text: initialPrompt }])
    setAssistantMessage(initialPrompt)
    setDetectedLanguage('English')
    setTranscriptPreview('')
    setIsComplete(false)
    setError('')
    setIsRecording(false)
    setIsListening(false)
    isSubmittingRef.current = false
    setIsSubmitting(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const Win = window as any
    const recognitionCtor = Win.SpeechRecognition || Win.webkitSpeechRecognition
    if (!recognitionCtor) {
      setSupportMessage('Browser does not support speech recognition. Use text fallback.')
      return
    }

    const rec = new recognitionCtor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = true
    rec.maxAlternatives = 1
    rec.onstart = () => setIsListening(true)
    rec.onend = () => setIsListening(false)
    rec.onerror = (e: any) => {
      setError(e?.error || 'Speech recognition failed')
      setIsListening(false)
      setIsRecording(false)
    }
    rec.onresult = (e: any) => {
      let fin = ''
      let inter = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0]?.transcript || ''
        if (e.results[i].isFinal) fin += text
        else inter += text
      }
      if (fin.trim()) committedTranscriptRef.current = `${committedTranscriptRef.current} ${fin}`.trim()
      setTranscriptPreview(`${committedTranscriptRef.current} ${inter}`.trim())

      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current)
      if (committedTranscriptRef.current.trim()) {
        silenceTimerRef.current = window.setTimeout(() => {
          const toSend = committedTranscriptRef.current.trim()
          if (!toSend || toSend === lastSubmittedTranscriptRef.current || isSubmittingRef.current) return
          lastSubmittedTranscriptRef.current = toSend
          committedTranscriptRef.current = ''
          setTranscriptPreview('')
          void sendTranscript(toSend)
        }, 1200)
      }
    }
    recognitionRef.current = rec

    return () => {
      rec.stop()
      recognitionRef.current = null
    }
  }, [])

  return {
    isRecording,
    isListening,
    isSubmitting,
    isComplete,
    isVoiceOutputEnabled,
    setIsVoiceOutputEnabled,
    isSpeaking,
    assistantMessage,
    detectedLanguage,
    draft,
    chatItems,
    error,
    transcriptPreview,
    supportMessage,
    toggleMic,
    sendTranscript,
    resetConversation,
  }
}
