'use client'

import { useEffect, useRef, useState } from 'react'
import { createSpeechRecognition, processRecognitionResult } from './speech-recognition-setup'

export function useIntakeSpeech(onTranscriptReady: (transcript: string) => void) {
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<number | null>(null)
  const committedTranscriptRef = useRef('')
  const lastSubmittedRef = useRef('')

  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcriptPreview, setTranscriptPreview] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const recognition = createSpeechRecognition()

    if (!recognition) {
      setSupportMessage('Browser does not support speech recognition.')
      return
    }

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = (e: any) => setError(e.error || 'Failed')
    recognition.onresult = (e: any) => {
      processRecognitionResult(e, committedTranscriptRef, setTranscriptPreview)

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

      if (committedTranscriptRef.current.trim()) {
        silenceTimerRef.current = window.setTimeout(() => {
          const transcript = committedTranscriptRef.current.trim()
          if (transcript && transcript !== lastSubmittedRef.current) {
            lastSubmittedRef.current = transcript
            committedTranscriptRef.current = ''
            setTranscriptPreview('')
            onTranscriptReady(transcript)
          }
        }, 1200)
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [onTranscriptReady])

  const start = async () => {
    setError('')
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()))
      committedTranscriptRef.current = ''
      lastSubmittedRef.current = ''
      setTranscriptPreview('')
      recognitionRef.current?.start()
      setIsRecording(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone denied')
    }
  }

  const stop = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    recognitionRef.current?.stop()
    setIsRecording(false)

    const transcript = committedTranscriptRef.current.trim()
    if (transcript && transcript !== lastSubmittedRef.current) {
      lastSubmittedRef.current = transcript
      committedTranscriptRef.current = ''
      onTranscriptReady(transcript)
    }
  }

  const reset = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    recognitionRef.current?.stop()
    committedTranscriptRef.current = ''
    lastSubmittedRef.current = ''
    setTranscriptPreview('')
    setError('')
    setIsRecording(false)
    setIsListening(false)
  }

  return { isRecording, isListening, transcriptPreview, supportMessage, error, start, stop, reset, setError }
}
