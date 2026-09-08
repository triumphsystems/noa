'use client';

/**
 * useIntakeVoice — Bedrock Nova 2 Sonic Voice Intake Hook
 *
 * Modularized clinical voice engine for patient intake consultations.
 * Integrates bidirectional WebSocket streaming (Nova 2 Sonic) with
 * DynamoDB patient profile synchronization and resilient refresh recovery.
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { http } from '@/lib/http';
import {
  type IntakeConversationDraft,
  INITIAL_DRAFT,
  DEFAULT_INITIAL_PROMPT,
} from '@/lib/voice/types';
import {
  SAMPLE_RATE,
  WS_RECONNECT_DELAY_BASE_MS,
  WS_RECONNECT_DELAY_MAX_MS,
  registerPcmWorklet,
} from '@/lib/voice/pcm-capture';
import { AudioQueuePlayer } from '@/lib/voice/audio-queue-player';
import {
  speakWithBrowserSynthesis,
  stopBrowserSynthesis,
  startBrowserSpeechRecognition,
} from '@/lib/voice/browser-speech';
import {
  saveActiveIntakeSession,
  loadActiveIntakeSession,
  clearActiveIntakeSession,
} from '@/lib/voice/intake-storage';

export type ConversationEntry = {
  id: string;
  role: 'assistant' | 'patient' | 'system';
  text: string;
};

type IntakeTurn = {
  assistantMessage: string;
  detectedLanguage: string;
  normalizedTranscript: string;
  draft: IntakeConversationDraft;
  missingFields: string[];
  isComplete: boolean;
  summary: string;
};

function generateSessionId(): string {
  return `intake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildWsUrl(
  sessionId: string,
  patientId?: string,
  intakeId?: string,
  language?: string
): string {
  if (typeof window === 'undefined') return '';
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const params = new URLSearchParams({ sessionId });
  if (patientId) params.set('patientId', patientId);
  if (intakeId) params.set('intakeId', intakeId);
  if (language) params.set('language', language);
  return `${proto}//${window.location.host}/api/voice/session?${params.toString()}`;
}

export function useIntakeVoice() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Initial State Restoration from SessionStorage (Survives Refresh)
  const cachedSession = useRef(loadActiveIntakeSession()).current;

  const [draft, setDraft] = useState<IntakeConversationDraft>(
    cachedSession?.draft || INITIAL_DRAFT
  );
  const [assistantMessage, setAssistantMessage] = useState<string>(
    cachedSession?.assistantMessage || DEFAULT_INITIAL_PROMPT
  );
  const [history, setHistory] = useState<ConversationEntry[]>(
    cachedSession?.history && cachedSession.history.length > 0
      ? cachedSession.history
      : [{ id: 'system-1', role: 'system', text: DEFAULT_INITIAL_PROMPT }]
  );
  const [detectedLanguage, setDetectedLanguage] = useState(
    cachedSession?.detectedLanguage || 'English'
  );
  const [doctorId, setDoctorId] = useState(cachedSession?.doctorId || '');
  const [patientId, setPatientId] = useState(cachedSession?.patientId || '');

  // UI / Connection State
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);
  const [error, setError] = useState('');
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  // Audio & WebSocket Refs
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef(generateSessionId());
  const intakeIdRef = useRef<string>(cachedSession?.intakeId || '');
  const recordingContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechBufferRef = useRef<string>('');
  const latestInterimRef = useRef<string>('');
  const isIdlePausedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const isCompleteRef = useRef(false);
  const isVoiceOutputRef = useRef(true);
  const isRecordingRef = useRef(false);
  const reconnectDelayRef = useRef(WS_RECONNECT_DELAY_BASE_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // VAD & Turn Taking Refs
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const hasSpokenInTurnRef = useRef<boolean>(false);
  const receivedSonicAudioRef = useRef<boolean>(false);
  const autoResumeAfterSpeechRef = useRef<boolean>(false);
  const fallbackSpeechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRecordingRef = useRef<() => Promise<void>>(async () => {});
  const stopRecordingRef = useRef<(isAuto?: boolean) => void>(() => {});

  // Continuous conversation callback when Nova Sonic or fallback audio finishes
  const handleAssistantFinishedSpeaking = useCallback(() => {
    if (isCompleteRef.current) return;
    if (autoResumeAfterSpeechRef.current) {
      setTimeout(() => {
        if (
          !isRecordingRef.current &&
          !isCompleteRef.current &&
          !isSubmittingRef.current
        ) {
          void startRecordingRef.current();
        }
      }, 500);
    }
  }, []);

  // Audio queue player for Nova Sonic neural audio (Primary Voice Engine)
  const audioPlayerRef = useRef<AudioQueuePlayer | null>(null);
  if (!audioPlayerRef.current && typeof window !== 'undefined') {
    audioPlayerRef.current = new AudioQueuePlayer({
      onSpeakingChange: (speaking) => setIsSpeaking(speaking),
      onPlaybackComplete: () => {
        handleAssistantFinishedSpeaking();
      },
    });
  }

  // Ref tracking forward declaration
  const sendTranscriptRef = useRef<(text: string, isVoiceTurn?: boolean) => Promise<void>>(
    async () => {}
  );

  const chatItems = useMemo(
    () => history.filter((item) => item.role !== 'system'),
    [history]
  );

  // Sync ref values
  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);
  useEffect(() => {
    isVoiceOutputRef.current = isVoiceOutputEnabled;
  }, [isVoiceOutputEnabled]);

  // Persist current session state to sessionStorage on changes
  useEffect(() => {
    if (!isComplete) {
      saveActiveIntakeSession({
        draft,
        history,
        assistantMessage,
        intakeId: intakeIdRef.current || undefined,
        patientId,
        doctorId,
        detectedLanguage,
      });
    }
  }, [draft, history, assistantMessage, patientId, doctorId, detectedLanguage, isComplete]);

  // Resolve Doctor & Patient IDs from URL query params
  useEffect(() => {
    const qDoctorId =
      searchParams?.get('doctorId') ||
      searchParams?.get('doctorCode') ||
      window.localStorage?.getItem('doctorId') ||
      '';
    const qPatientId =
      searchParams?.get('patientId') ||
      window.localStorage?.getItem('patientId') ||
      '';
    const qIntakeId = searchParams?.get('intakeId') || '';

    if (qDoctorId && !doctorId) setDoctorId(qDoctorId);
    if (qPatientId && !patientId) setPatientId(qPatientId);
    if (qIntakeId && !intakeIdRef.current) intakeIdRef.current = qIntakeId;
  }, [searchParams, doctorId, patientId]);

  // ────────────────────────────────────────────────────────────────────────
  // Smart Intake: Prefill & Sync with DynamoDB (No Race Condition)
  // ────────────────────────────────────────────────────────────────────────
  const prefillDoneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrefill() {
      try {
        const queryParams = new URLSearchParams();
        if (doctorId) queryParams.set('doctorId', doctorId);
        if (patientId) queryParams.set('patientId', patientId);
        if (intakeIdRef.current) queryParams.set('intakeId', intakeIdRef.current);

        const data = await http.get<{
          success: boolean;
          authenticated: boolean;
          draft: IntakeConversationDraft;
          initialPrompt: string;
          patientId: string | null;
          doctorId: string | null;
          intakeId: string | null;
        }>(`/api/intakes/conversation?${queryParams.toString()}`, {
          skipAuthRedirect: true,
        });

        if (cancelled) return;

        if (data?.draft && Object.keys(data.draft).length > 0) {
          setDraft((prev) => ({ ...prev, ...data.draft }));
        }
        if (data?.intakeId) {
          intakeIdRef.current = data.intakeId;
        }
        if (data?.patientId && !patientId) {
          setPatientId(data.patientId);
        }
        if (data?.doctorId && !doctorId) {
          setDoctorId(data.doctorId);
        }

        // Only replace initial prompt if no patient speech turns have occurred yet
        const hasUserTurns = history.some((h) => h.role === 'patient');
        if (data?.initialPrompt && !hasUserTurns) {
          setAssistantMessage(data.initialPrompt);
          setHistory([
            { id: 'system-1', role: 'system', text: data.initialPrompt },
          ]);
        }
      } catch (err) {
        console.warn('[Voice/Prefill] Could not load prefill data:', err);
      }
    }

    if (!prefillDoneRef.current) {
      prefillDoneRef.current = true;
      void fetchPrefill();
    }

    return () => {
      cancelled = true;
    };
  }, [doctorId, patientId, history]);

  // ────────────────────────────────────────────────────────────────────────
  // History & Vocalization
  // ────────────────────────────────────────────────────────────────────────
  const pushHistory = useCallback(
    (role: ConversationEntry['role'], text: string) => {
      if (!text.trim()) return;
      setHistory((prev) => [
        ...prev,
        {
          id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          role,
          text,
        },
      ]);
    },
    []
  );

  const speakText = useCallback(
    (text: string) => {
      if (!isVoiceOutputRef.current) return;
      speakWithBrowserSynthesis(text, detectedLanguage, (speaking) => {
        setIsSpeaking(speaking);
        if (!speaking) {
          handleAssistantFinishedSpeaking();
        }
      });
    },
    [detectedLanguage, handleAssistantFinishedSpeaking]
  );

  // ────────────────────────────────────────────────────────────────────────
  // WebSocket Connection to /api/voice/session
  // ────────────────────────────────────────────────────────────────────────
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = buildWsUrl(
      sessionIdRef.current,
      patientId || undefined,
      intakeIdRef.current || undefined,
      detectedLanguage
    );
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError('');
      reconnectDelayRef.current = WS_RECONNECT_DELAY_BASE_MS;
      ws.send(
        JSON.stringify({
          type: 'init',
          draft,
          patientId,
          intakeId: intakeIdRef.current,
        })
      );
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'transcript_chunk' && msg.payload?.text) {
            setTranscriptPreview((prev) =>
              prev ? `${prev} ${msg.payload.text}` : msg.payload.text
            );
          } else if (msg.type === 'assistant_message' && msg.payload?.text) {
            setAssistantMessage(msg.payload.text);
            pushHistory('assistant', msg.payload.text);
            setTranscriptPreview('');
          } else if (msg.type === 'idle_timeout') {
            isIdlePausedRef.current = true;
            isRecordingRef.current = false;
            setIsRecording(false);
            setSupportMessage('Voice paused due to inactivity. Tap mic to resume.');
          } else if (msg.type === 'error') {
            setError(msg.message || 'Voice stream error');
          }
        } catch {
          // Ignore non-JSON control messages
        }
        return;
      }

      // Binary/Blob audio: Amazon Bedrock Nova Sonic neural speech playback (Primary)
      let audioBuffer: ArrayBuffer | null = null;
      if (event.data instanceof ArrayBuffer) {
        audioBuffer = event.data;
      } else if (typeof Blob !== 'undefined' && event.data instanceof Blob) {
        audioBuffer = await event.data.arrayBuffer();
      }

      if (audioBuffer && isVoiceOutputRef.current) {
        receivedSonicAudioRef.current = true;
        // Nova Sonic audio is active; cancel any pending fallback synthesis
        stopBrowserSynthesis();
        if (fallbackSpeechTimerRef.current) {
          clearTimeout(fallbackSpeechTimerRef.current);
          fallbackSpeechTimerRef.current = null;
        }
        audioPlayerRef.current?.pushChunk(audioBuffer);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      if (!isCompleteRef.current && !isIdlePausedRef.current) {
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 2,
          WS_RECONNECT_DELAY_MAX_MS
        );
        reconnectTimerRef.current = setTimeout(
          connectWebSocket,
          reconnectDelayRef.current
        );
      }
    };

    ws.onerror = () => {
      if (!isIdlePausedRef.current) {
        setSupportMessage('Voice connection interrupted. Reconnecting…');
      }
    };
  }, [detectedLanguage, draft, patientId, pushHistory]);

  // ────────────────────────────────────────────────────────────────────────
  // Recording Management & VAD Silence Detection
  // ────────────────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    setError('');

    if (
      isIdlePausedRef.current ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    ) {
      isIdlePausedRef.current = false;
      setSupportMessage('');
      sessionIdRef.current = generateSessionId();
      connectWebSocket();
    }

    try {
      // Unblock Nova Sonic playback AudioContext on user interaction
      await audioPlayerRef.current?.resume();
      stopBrowserSynthesis();

      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
      recordingContextRef.current = ctx;

      await registerPcmWorklet(ctx);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
        },
      });
      mediaStreamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);

      // Web Audio AnalyserNode for Real-time Voice Activity Detection (VAD)
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      const worklet = new AudioWorkletNode(ctx, 'pcm-capture');
      workletNodeRef.current = worklet;
      source.connect(worklet);

      speechBufferRef.current = '';
      latestInterimRef.current = '';
      hasSpokenInTurnRef.current = false;
      lastSpeechTimeRef.current = Date.now();
      receivedSonicAudioRef.current = false;

      // Concurrent speech recognition for real-time transcription
      recognitionRef.current = startBrowserSpeechRecognition({
        language: detectedLanguage,
        onInterim: (text) => {
          const trimmed = text.trim();
          if (trimmed) {
            hasSpokenInTurnRef.current = true;
            lastSpeechTimeRef.current = Date.now();
            latestInterimRef.current = trimmed;
            setTranscriptPreview(
              (speechBufferRef.current + ' ' + trimmed).trim()
            );
          }
        },
        onFinalTurn: (text) => {
          const trimmed = text.trim();
          if (trimmed) {
            hasSpokenInTurnRef.current = true;
            lastSpeechTimeRef.current = Date.now();
            speechBufferRef.current = (
              speechBufferRef.current +
              ' ' +
              trimmed
            ).trim();
            latestInterimRef.current = '';
            setTranscriptPreview(speechBufferRef.current);
          }
        },
      });

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'audio_start' }));
      }

      worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(event.data);
        }
      };

      // VAD Silence Detection Interval: monitors microphone audio level
      // and automatically completes the patient's turn after speech is followed by silence
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = setInterval(() => {
        if (!analyserRef.current || !isRecordingRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avgVolume = sum / dataArray.length;

        // Vocal activity threshold
        if (avgVolume > 14) {
          lastSpeechTimeRef.current = Date.now();
        }

        // When the patient has spoken and a 1.8-second silence pause is detected:
        if (hasSpokenInTurnRef.current) {
          const elapsedSilence = Date.now() - lastSpeechTimeRef.current;
          if (elapsedSilence >= 1800) {
            // Patient finished speaking! Auto-complete turn and notify Bedrock Nova Sonic:
            stopRecordingRef.current(true);
          }
        }
      }, 100);

      isRecordingRef.current = true;
      setIsRecording(true);
      setTranscriptPreview('Listening…');
    } catch (err: any) {
      const msg = err?.message || 'Unable to access microphone';
      setError(msg);
      setSupportMessage(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission denied. You can also use the keyboard below.'
          : msg
      );
    }
  }, [connectWebSocket, detectedLanguage]);

  const stopRecording = useCallback((isAuto = false) => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    analyserRef.current = null;
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    recordingContextRef.current?.close().catch(() => {});
    recordingContextRef.current = null;
    isRecordingRef.current = false;
    setIsRecording(false);

    const turnText = (
      speechBufferRef.current +
      ' ' +
      latestInterimRef.current
    ).trim();
    speechBufferRef.current = '';
    latestInterimRef.current = '';
    hasSpokenInTurnRef.current = false;

    // Signal audio_end to Bedrock Nova Sonic bidirectional stream
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'audio_end' }));
    }

    autoResumeAfterSpeechRef.current = isAuto;

    if (turnText) {
      void sendTranscriptRef.current(turnText, true, isAuto);
    }
  }, []);

  startRecordingRef.current = startRecording;
  stopRecordingRef.current = stopRecording;

  const toggleMic = useCallback(() => {
    if (isRecordingRef.current) {
      autoResumeAfterSpeechRef.current = false;
      stopRecording(false);
    } else {
      void startRecording();
    }
  }, [startRecording, stopRecording]);

  // ────────────────────────────────────────────────────────────────────────
  // Transcript Processing (Nova Lite Extraction + DynamoDB Persistence)
  // ────────────────────────────────────────────────────────────────────────
  const sendTranscript = useCallback(
    async (transcript: string, isVoiceTurn = false, isAuto = false) => {
      const trimmed = transcript.trim();
      if (!trimmed || isSubmittingRef.current || isCompleteRef.current) return;

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setError('');
      setTranscriptPreview('');
      pushHistory('patient', trimmed);

      autoResumeAfterSpeechRef.current = isVoiceTurn && isAuto;
      await audioPlayerRef.current?.resume();

      const outgoingHistory = [
        ...history,
        {
          id: `patient-${Date.now()}`,
          role: 'patient' as const,
          text: trimmed,
        },
      ];

      try {
        const data = await http.post<{
          success: boolean;
          turn: IntakeTurn;
          intakeId?: string;
          patientId?: string;
          savedIntake?: any;
        }>(
          '/api/intakes/conversation',
          {
            transcript: trimmed,
            language: detectedLanguage,
            history: outgoingHistory.map((item) => ({
              role: item.role,
              content: item.text,
              timestamp: Date.now(),
            })),
            draft,
            doctorId,
            patientId,
            intakeId: intakeIdRef.current || undefined,
          },
          { skipAuthRedirect: true }
        );

        if (data?.intakeId) {
          intakeIdRef.current = data.intakeId;
        }
        if (data?.patientId && !patientId) {
          setPatientId(data.patientId);
        }

        const nextTurn = data.turn;
        const updatedDraft = nextTurn.draft || draft;
        setDraft(updatedDraft);
        setAssistantMessage(nextTurn.assistantMessage);
        setDetectedLanguage(nextTurn.detectedLanguage || detectedLanguage);
        pushHistory('assistant', nextTurn.assistantMessage);

        // If submitted via typed fallback, request Nova Sonic to speak over WebSocket
        if (!isVoiceTurn && wsRef.current?.readyState === WebSocket.OPEN) {
          receivedSonicAudioRef.current = false;
          wsRef.current.send(
            JSON.stringify({
              type: 'speak',
              text: nextTurn.assistantMessage,
            })
          );
        }

        // Amazon Bedrock Nova Sonic is the primary speech engine streaming neural audio over WebSocket.
        // If Nova Sonic encounters an error, disconnects, or produces no audio within a 1.2s grace period,
        // we activate the Web Speech fallback so the consultation never falls silent.
        if (isVoiceOutputRef.current) {
          if (fallbackSpeechTimerRef.current) {
            clearTimeout(fallbackSpeechTimerRef.current);
          }

          fallbackSpeechTimerRef.current = setTimeout(() => {
            if (!receivedSonicAudioRef.current && !isCompleteRef.current) {
              speakText(nextTurn.assistantMessage);
            }
          }, 1200);
        }

        if (nextTurn.isComplete) {
          setIsComplete(true);
          isCompleteRef.current = true;
          autoResumeAfterSpeechRef.current = false;
          stopRecordingRef.current(false);

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'end' }));
          }

          clearActiveIntakeSession();
          sessionStorage.setItem(
            'intake-completion',
            JSON.stringify({
              summary: nextTurn.summary,
              draft: updatedDraft,
              language: nextTurn.detectedLanguage || detectedLanguage,
              doctorId,
              patientId: data?.patientId || patientId,
              intakeId: data?.intakeId || intakeIdRef.current,
            })
          );

          const delay = Math.max(3000, nextTurn.assistantMessage.length * 60);
          setTimeout(() => {
            router.push('/intake/confirmation');
          }, delay);
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        pushHistory('assistant', 'I missed that. Could you please repeat?');
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [
      history,
      draft,
      detectedLanguage,
      doctorId,
      patientId,
      router,
      pushHistory,
      speakText,
    ]
  );

  sendTranscriptRef.current = sendTranscript;

  const finalizeIntake = useCallback(() => {
    if (isCompleteRef.current || isSubmittingRef.current) return;
    void sendTranscript(
      'I confirm all my health information and give consent to finalize and submit my intake.'
    );
  }, [sendTranscript]);

  // ────────────────────────────────────────────────────────────────────────
  // Lifecycle & Reset
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      if (fallbackSpeechTimerRef.current) clearTimeout(fallbackSpeechTimerRef.current);
      wsRef.current?.close();
      stopRecording();
      audioPlayerRef.current?.close();
      stopBrowserSynthesis();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetConversation = useCallback(() => {
    clearActiveIntakeSession();
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    if (fallbackSpeechTimerRef.current) clearTimeout(fallbackSpeechTimerRef.current);
    stopRecording();
    wsRef.current?.close();
    sessionIdRef.current = generateSessionId();
    intakeIdRef.current = '';
    speechBufferRef.current = '';
    latestInterimRef.current = '';
    isIdlePausedRef.current = false;
    receivedSonicAudioRef.current = false;
    autoResumeAfterSpeechRef.current = false;
    setSupportMessage('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setDraft(INITIAL_DRAFT);
    setHistory([
      { id: 'system-1', role: 'system', text: DEFAULT_INITIAL_PROMPT },
    ]);
    setAssistantMessage(DEFAULT_INITIAL_PROMPT);
    setDetectedLanguage('English');
    setTranscriptPreview('');
    setIsComplete(false);
    setError('');
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    audioPlayerRef.current?.clear();
    setTimeout(connectWebSocket, 500);
  }, [stopRecording, connectWebSocket]);

  const replayAssistantMessage = useCallback(() => {
    if (isSpeaking) {
      stopBrowserSynthesis();
      audioPlayerRef.current?.clear();
      setIsSpeaking(false);
    } else if (assistantMessage) {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        receivedSonicAudioRef.current = false;
        wsRef.current.send(
          JSON.stringify({
            type: 'speak',
            text: assistantMessage,
          })
        );
      }
      setTimeout(() => {
        if (!receivedSonicAudioRef.current) {
          speakText(assistantMessage);
        }
      }, 1200);
    }
  }, [assistantMessage, isSpeaking, speakText]);

  return {
    isRecording,
    isConnected,
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
    sendTranscript: (txt: string) => sendTranscript(txt, false),
    finalizeIntake,
    resetConversation,
    replayAssistantMessage,
    isListening: isRecording,
  };
}
