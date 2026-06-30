'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { IntakeConversationDraft, IntakeConversationMessage } from '@/lib/voice-types'
import { useIntakeSpeech } from './use-intake-speech'

const initialDraft: IntakeConversationDraft = {
  firstName: '', lastName: '', dateOfBirth: '', gender: '', email: '', phone: '', address: '',
  medicalConditions: [], surgeries: '', allergies: [], currentMedications: [], familyHistory: '',
  smokingStatus: '', alcoholUse: '', exerciseFrequency: '', emergencyContactName: '',
  emergencyContactPhone: '', emergencyContactRelation: '', consentRead: false,
}

interface ConversationEntry {
  id: string
  role: 'assistant' | 'patient' | 'system'
  text: string
}

export interface IntakeState {
  isSubmitting: boolean
  isComplete: boolean
  assistantMessage: string
  detectedLanguage: string
  draft: IntakeConversationDraft
  history: ConversationEntry[]
  doctorId: string
  patientId: string
  canPersist: boolean
  chatItems: ConversationEntry[]
  speechControls: ReturnType<typeof useIntakeSpeech>
  handleMicPress: () => void
  skipToText: () => void
  resetConversation: () => void
}

export function useIntakeContainer(): IntakeState {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [assistantMessage, setAssistantMessage] = useState("Hi, I'm Noa. I'll ask one question at a time.")
  const [detectedLanguage, setDetectedLanguage] = useState('English')
  const [draft, setDraft] = useState<IntakeConversationDraft>(initialDraft)
  const [history, setHistory] = useState<ConversationEntry[]>([
    { id: 'system-1', role: 'system', text: 'Session started' },
  ])
  const [doctorId, setDoctorId] = useState('')
  const [patientId, setPatientId] = useState('')

  useEffect(() => {
    setDoctorId(searchParams?.get('doctorId') || window.localStorage.getItem('doctorId') || '')
    setPatientId(searchParams?.get('patientId') || window.localStorage.getItem('patientId') || '')
  }, [searchParams])

  const handleTranscriptReady = useCallback(
    async (transcript: string) => {
      const trimmed = transcript.trim()
      if (!trimmed) return

      setIsSubmitting(true)
      const newHistory = [...history, { id: `p-${Date.now()}`, role: 'patient', text: trimmed }]
      setHistory(newHistory)

      try {
        const res = await fetch('/api/intakes/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: trimmed,
            language: detectedLanguage,
            history: newHistory.map(i => ({ role: i.role, content: i.text, timestamp: Date.now() })) satisfies IntakeConversationMessage[],
            draft,
            doctorId,
            patientId,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.message)

        setDraft(data.turn.draft || draft)
        setAssistantMessage(data.turn.assistantMessage)
        setDetectedLanguage(data.turn.detectedLanguage || detectedLanguage)
        setHistory(p => [...p, { id: `a-${Date.now()}`, role: 'assistant', text: data.turn.assistantMessage }])

        if (data.turn.isComplete) {
          setIsComplete(true)
          sessionStorage.setItem('intake-completion', JSON.stringify({
            summary: data.turn.summary,
            draft: data.turn.draft || draft,
            language: data.turn.detectedLanguage || detectedLanguage,
            doctorId,
            patientId,
          }))
          router.push('/intake/confirmation')
        }
      } catch (err) {
        console.error('[v0] Error:', err)
        setHistory(p => [...p, { id: `a-${Date.now()}`, role: 'assistant', text: 'Please try again.' }])
      } finally {
        setIsSubmitting(false)
      }
    },
    [history, detectedLanguage, draft, doctorId, patientId, router]
  )

  const speechControls = useIntakeSpeech(handleTranscriptReady)
  const chatItems = useMemo(() => history.filter(i => i.role !== 'system'), [history])
  const canPersist = Boolean(doctorId && patientId)

  return {
    isSubmitting,
    isComplete,
    assistantMessage,
    detectedLanguage,
    draft,
    history,
    doctorId,
    patientId,
    canPersist,
    chatItems,
    speechControls,
    handleMicPress: () => speechControls.isRecording ? speechControls.stop() : speechControls.start(),
    skipToText: () => { const t = window.prompt('Type:'); if (t) handleTranscriptReady(t) },
    resetConversation: () => {
      setHistory([{ id: 's-1', role: 'system', text: 'Reset' }])
      setDraft(initialDraft)
      setAssistantMessage("Hi, I'm Noa.")
      setDetectedLanguage('English')
      setIsComplete(false)
      speechControls.reset()
    },
  }
}
