'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Mic, MicOff, Sparkles } from 'lucide-react'

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

type ConversationEntry = {
  id: string
  role: 'assistant' | 'patient' | 'system'
  text: string
}

type SpeechRecognitionInstance = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onresult: ((event: {
    resultIndex: number
    results: Array<{ isFinal: boolean; 0: { transcript: string } }>
  }) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

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

const defaultPrompt = 'Tap the microphone and answer in your own words.'
export default function PatientIntakePage() {
  return (
    <Suspense fallback={<div className="space-y-6 min-h-screen bg-canvas" />}>
      <PatientIntake />
    </Suspense>
  )
}
function PatientIntake() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const silenceTimerRef = useRef<number | null>(null)
  const isStartingRef = useRef(false)
  const isSubmittingRef = useRef(false)
  const committedTranscriptRef = useRef('')
  const lastSubmittedTranscriptRef = useRef('')
  const isHandsFreeRef = useRef(true)
  const isCompleteRef = useRef(false)
  const isVoiceOutputRef = useRef(true)

  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isHandsFree, setIsHandsFree] = useState(true)
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

  const canPersist = Boolean(doctorId && patientId)

  const chatItems = useMemo(() => history.filter(item => item.role !== 'system'), [history])

  useEffect(() => {
    isHandsFreeRef.current = isHandsFree
  }, [isHandsFree])

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
    const resolvedDoctorId = searchParams?.get('doctorId') || window.localStorage.getItem('doctorId') || ''
    const resolvedPatientId = searchParams?.get('patientId') || window.localStorage.getItem('patientId') || ''

    setDoctorId(resolvedDoctorId)
    setPatientId(resolvedPatientId)
  }, [searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const recognitionCtor =
      (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition

    if (!recognitionCtor) {
      setSupportMessage('This browser does not support live speech recognition. You can still use the text fallback.')
      return
    }

    const recognition = new recognitionCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = event => {
      setError(event.error || 'Speech recognition failed')
      setIsListening(false)
      setIsRecording(false)
    }

    recognition.onresult = event => {
      let finalText = ''
      let interimText = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result[0]?.transcript || ''

        if (result.isFinal) {
          finalText += transcript
        } else {
          interimText += transcript
        }
      }

      if (finalText.trim()) {
        committedTranscriptRef.current = `${committedTranscriptRef.current} ${finalText}`.trim()
      }

      const liveTranscript = `${committedTranscriptRef.current} ${interimText}`.trim()
      setTranscriptPreview(liveTranscript)

      if (silenceTimerRef.current) {
        window.clearTimeout(silenceTimerRef.current)
      }

      if (committedTranscriptRef.current.trim()) {
        silenceTimerRef.current = window.setTimeout(() => {
          const transcriptToSend = committedTranscriptRef.current.trim()

          if (!transcriptToSend || transcriptToSend === lastSubmittedTranscriptRef.current || isSubmittingRef.current) {
            return
          }

          lastSubmittedTranscriptRef.current = transcriptToSend
          committedTranscriptRef.current = ''
          setTranscriptPreview('')
          void sendTranscript(transcriptToSend)
        }, 1200)
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        window.clearTimeout(silenceTimerRef.current)
      }
      recognitionRef.current?.stop()
    }
  }, [])

  const pushHistory = (role: ConversationEntry['role'], text: string) => {
    if (!text.trim()) return

    setHistory(previous => [...previous, { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text }])
  }

  const speakMessage = (text: string, language: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !isVoiceOutputRef.current) {
      return
    }

    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = mapLanguageToBcp47(language)
      utterance.rate = 0.95
      utterance.pitch = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        if (isHandsFreeRef.current && !isCompleteRef.current) {
          setTimeout(() => {
            void startRecording()
          }, 400)
        }
      }
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    } catch {
      setIsSpeaking(false)
    }
  }

  const syncDraftAndHistory = (nextDraft: IntakeConversationDraft, nextAssistantMessage: string, nextLanguage: string) => {
    setDraft(nextDraft)
    setAssistantMessage(nextAssistantMessage)
    setDetectedLanguage(nextLanguage)
    pushHistory('assistant', nextAssistantMessage)
    speakMessage(nextAssistantMessage, nextLanguage)
  }

  const sendTranscript = async (transcript: string) => {
    const trimmedTranscript = transcript.trim()

    if (!trimmedTranscript || isSubmittingRef.current) {
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setError('')
    pushHistory('patient', trimmedTranscript)

    const outgoingHistory: ConversationEntry[] = [...history, { id: `patient-${Date.now()}`, role: 'patient', text: trimmedTranscript }]

    try {
      const response = await fetch('/api/intakes/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: trimmedTranscript,
          language: detectedLanguage,
          history: outgoingHistory.map(item => ({
            role: item.role,
            content: item.text,
            timestamp: Date.now(),
          })) satisfies IntakeConversationMessage[],
          draft,
          doctorId,
          patientId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process intake response')
      }

      const nextTurn: IntakeTurn = data.turn
      const updatedDraft = nextTurn.draft || draft

      syncDraftAndHistory(updatedDraft, nextTurn.assistantMessage, nextTurn.detectedLanguage || detectedLanguage)

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
          }),
        )
        router.push('/intake/confirmation')
      }
    } catch (incomingError) {
      setError(incomingError instanceof Error ? incomingError.message : 'An error occurred')
      pushHistory('assistant', 'I missed that. Please try again.')
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const startRecording = async () => {
    if (isStartingRef.current || isRecording || isSubmittingRef.current) {
      return
    }

    isStartingRef.current = true
    setError('')

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        stream.getTracks().forEach(track => track.stop())
      })

      committedTranscriptRef.current = ''
      lastSubmittedTranscriptRef.current = ''
      setTranscriptPreview('')

      recognitionRef.current?.start()
      setIsRecording(true)
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : 'Unable to access microphone')
      setIsRecording(false)
    } finally {
      isStartingRef.current = false
    }
  }

  const stopRecording = () => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    recognitionRef.current?.stop()
    setIsRecording(false)
    setIsListening(false)

    const transcript = committedTranscriptRef.current.trim()
    if (transcript && transcript !== lastSubmittedTranscriptRef.current) {
      lastSubmittedTranscriptRef.current = transcript
      committedTranscriptRef.current = ''
      void sendTranscript(transcript)
    }
  }

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording()
      return
    }

    void startRecording()
  }

  const skipToText = () => {
    const transcript = window.prompt('Type what the patient said')
    if (transcript) {
      void sendTranscript(transcript)
    }
  }

  const resetConversation = () => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current)
    }

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

  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-hi-yellow font-semibold mb-1 sm:mb-2">Voice intake</p>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif">Talk, don’t type</h1>
            <p className="mt-1 sm:mt-2 max-w-2xl text-xs sm:text-sm text-slate">
              One microphone. No forms. Noa will listen, translate, and ask the next question conversationally.
            </p>
          </div>
          <Link href="/" className="shrink-0">
            <Button variant="outline" size="sm" className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow text-xs sm:text-sm">
              Exit
            </Button>
          </Link>
        </header>

        <main className="grid flex-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl sm:rounded-[2rem] border border-deep-ink/10 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="rounded-2xl sm:rounded-3xl bg-soft-meadow/50 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate">Noa says</p>
                      {isSpeaking && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-moss-green bg-moss-green/15 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-moss-green animate-ping" />
                          Speaking
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isVoiceOutputEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                          window.speechSynthesis.cancel()
                          setIsSpeaking(false)
                        }
                        setIsVoiceOutputEnabled(prev => !prev)
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-slate hover:text-deep-ink px-2.5 py-1 rounded-full border border-deep-ink/10 bg-white shadow-2xs transition-colors cursor-pointer"
                      title={isVoiceOutputEnabled ? 'Mute spoken responses' : 'Enable spoken responses'}
                    >
                      {isVoiceOutputEnabled ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-moss-green" />
                          <span className="text-[11px] font-medium">Voice on</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-slate" />
                          <span className="text-[11px] font-medium">Voice muted</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-lg sm:text-xl font-medium leading-7 sm:leading-8 text-deep-ink">{assistantMessage}</p>
                </div>

                <div className="grid gap-3 sm:gap-4 grid-cols-2">
                  <div className="rounded-2xl sm:rounded-3xl border border-deep-ink/10 bg-canvas p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate mb-1 sm:mb-2">Language</p>
                    <p className="font-medium text-sm sm:text-base text-deep-ink truncate">{detectedLanguage}</p>
                  </div>
                  <div className="rounded-2xl sm:rounded-3xl border border-deep-ink/10 bg-canvas p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate mb-1 sm:mb-2">Status</p>
                    <p className="font-medium text-sm sm:text-base text-deep-ink truncate">
                      {isSubmitting ? 'Processing' : isRecording ? 'Listening' : isComplete ? 'Complete' : 'Ready'}
                    </p>
                  </div>
                </div>

                {supportMessage && (
                  <div className="rounded-2xl sm:rounded-3xl border border-amber-200 bg-amber-50 p-3.5 sm:p-4 text-xs sm:text-sm text-amber-900">
                    {supportMessage}
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl sm:rounded-3xl border border-red-200 bg-red-50 p-3.5 sm:p-4 text-xs sm:text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="rounded-2xl sm:rounded-3xl border border-deep-ink/10 bg-canvas p-4 sm:p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate mb-2 sm:mb-3">Live transcript</p>
                  <p className="min-h-20 sm:min-h-24 text-sm sm:text-base leading-6 sm:leading-7 text-deep-ink">
                    {transcriptPreview || defaultPrompt}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate">
                  {isRecording ? (isListening ? 'Listening live' : 'Starting microphone') : 'Mic idle'}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row">
                <Button
                  onClick={handleMicPress}
                  disabled={isSubmitting}
                  className={`flex-1 rounded-full px-6 py-4 text-sm sm:text-base font-semibold ${isRecording ? 'bg-deep-ink text-white hover:bg-deep-ink/90' : 'bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90'}`}
                >
                  <span className="mr-2 inline-flex h-3 w-3 rounded-full bg-current opacity-70" />
                  {isRecording ? 'Stop microphone' : 'Start microphone'}
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={skipToText}
                    className="flex-1 sm:flex-initial rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow text-xs sm:text-sm"
                  >
                    Type fallback
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetConversation}
                    className="flex-1 sm:flex-initial rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow text-xs sm:text-sm"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4 sm:space-y-6">
            <div className="rounded-3xl sm:rounded-[2rem] border border-deep-ink/10 bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold font-serif mb-3 sm:mb-4">Conversation</h2>
              <div className="space-y-3 sm:space-y-4 max-h-80 overflow-y-auto">
                {chatItems.map(item => (
                  <div
                    key={item.id}
                    className={`rounded-2xl sm:rounded-3xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-5 sm:leading-6 ${item.role === 'assistant' ? 'bg-soft-meadow/50 text-deep-ink' : 'bg-canvas text-deep-ink border border-deep-ink/10'}`}
                  >
                    <p className="mb-1 text-[10px] uppercase tracking-[0.25em] text-slate">{item.role}</p>
                    <p>{item.text}</p>
                  </div>
                ))}
                {chatItems.length === 0 && (
                  <div className="rounded-2xl sm:rounded-3xl border border-dashed border-deep-ink/15 p-4 sm:p-6 text-xs sm:text-sm text-slate">
                    Your conversation will appear here as Noa asks questions and translates answers.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl sm:rounded-[2rem] border border-deep-ink/10 bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold font-serif mb-3 sm:mb-4">Captured so far</h2>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <Row label="Name" value={`${draft.firstName || '—'} ${draft.lastName || ''}`.trim()} />
                <Row label="DOB" value={draft.dateOfBirth || '—'} />
                <Row label="Email" value={draft.email || '—'} />
                <Row label="Phone" value={draft.phone || '—'} />
                <Row label="Conditions" value={draft.medicalConditions?.join(', ') || '—'} />
                <Row label="Allergies" value={draft.allergies?.join(', ') || '—'} />
                <Row label="Emergency contact" value={draft.emergencyContactName || '—'} />
              </div>
            </div>

            <div className="rounded-3xl sm:rounded-[2rem] border border-hi-yellow/30 bg-hi-yellow/10 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold font-serif mb-1 sm:mb-2">Next step</h2>
              <p className="text-xs sm:text-sm text-deep-ink leading-5 sm:leading-6">
                {canPersist
                  ? 'We can save the intake once complete.' : 'Intake is in progress.'
            }
              </p>
            </div>
          </aside>
        </main>

        <footer className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-[11px] sm:text-xs text-slate text-center sm:text-left">
          <p>Speak naturally. You can switch languages mid-conversation.</p>
          <p>{isComplete ? 'Ready for confirmation.' : 'Keep talking until Noa says you are done.'}</p>
        </footer>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-canvas px-4 py-3">
      <span className="text-slate">{label}</span>
      <span className="text-right font-medium text-deep-ink">{value}</span>
    </div>
  )
}
