'use client';

/**
 * useIntakeVoice — Nova 2 Sonic WebSocket Voice Intake Hook
 *
 * Replaces the legacy browser SpeechRecognition + speechSynthesis implementation
 * with a high-fidelity, bidirectional WebSocket connection to the Vercel-hosted
 * Nova 2 Sonic relay at /api/voice/session.
 *
 * Architecture:
 *   Browser AudioWorklet (16kHz PCM)
 *     → WSS /api/voice/session
 *       → Amazon Bedrock InvokeModelWithBidirectionalStream (nova-2-sonic-v1:0)
 *     ← WSS sends Nova Sonic audio chunks back
 *   Web Audio API plays the received audio (human-quality clinical voice)
 *
 * Fallback: If WebSocket or microphone access fails, the hook surfaces a clear
 * error message and falls back gracefully (silent mode + text input).
 *
 * Text-based intake field extraction continues to run through
 * POST /api/intakes/conversation → Nova 2 Lite, unchanged.
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { IntakeConversationDraft } from '@/lib/voice-service';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const SAMPLE_RATE = 16000; // Hz — required by Nova 2 Sonic
const SLICE_DURATION_MS = 100; // AudioWorklet flush interval
const WS_RECONNECT_DELAY_BASE_MS = 1000;
const WS_RECONNECT_DELAY_MAX_MS = 15000;

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
};

const INITIAL_PROMPT =
  "Hi, I'm Noa. I'll ask you one short question at a time. You can answer naturally in any language. Let's get started — what's your full name?";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function buildWsUrl(sessionId: string): string {
  if (typeof window === 'undefined') return '';
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/voice/session?sessionId=${encodeURIComponent(sessionId)}`;
}

function generateSessionId(): string {
  return `intake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// AudioWorklet processor (inlined as a Blob URL to avoid a separate file)
// Converts MediaStream Float32 PCM → 16kHz Int16 PCM binary frames
// ──────────────────────────────────────────────────────────────────────────────

const AUDIO_WORKLET_CODE = /* javascript */ `
class PcmCapture extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;
    // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
    const pcm = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const clamped = Math.max(-1, Math.min(1, input[i]));
      pcm[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
    }
    this.port.postMessage(pcm.buffer, [pcm.buffer]);
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
`;

// ──────────────────────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────────────────────

export function useIntakeVoice() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // WebSocket + audio refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const reconnectDelayRef = useRef(WS_RECONNECT_DELAY_BASE_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef(generateSessionId());

  // Submission state refs
  const isSubmittingRef = useRef(false);
  const isCompleteRef = useRef(false);
  const isVoiceOutputRef = useRef(true);

  // React state
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);
  const [assistantMessage, setAssistantMessage] = useState(INITIAL_PROMPT);
  const [detectedLanguage, setDetectedLanguage] = useState('English');
  const [draft, setDraft] = useState<IntakeConversationDraft>(initialDraft);
  const [history, setHistory] = useState<ConversationEntry[]>([
    { id: 'system-1', role: 'system', text: INITIAL_PROMPT },
  ]);
  const [error, setError] = useState('');
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [patientId, setPatientId] = useState('');

  const chatItems = useMemo(
    () => history.filter((item) => item.role !== 'system'),
    [history]
  );

  // Keep refs in sync
  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);
  useEffect(() => {
    isVoiceOutputRef.current = isVoiceOutputEnabled;
  }, [isVoiceOutputEnabled]);

  // Resolve IDs from query params / localStorage
  useEffect(() => {
    const resolvedDoctorId =
      searchParams?.get('doctorId') ||
      searchParams?.get('doctorCode') ||
      window.localStorage?.getItem('doctorId') ||
      '';
    const resolvedPatientId =
      searchParams?.get('patientId') ||
      window.localStorage?.getItem('patientId') ||
      '';
    setDoctorId(resolvedDoctorId);
    setPatientId(resolvedPatientId);
  }, [searchParams]);

  // ──────────────────────────────────────────────────────
  // Conversation history
  // ──────────────────────────────────────────────────────

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

  // ──────────────────────────────────────────────────────
  // Web Audio playback of Nova Sonic audio chunks
  // ──────────────────────────────────────────────────────

  const playNextChunk = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    if (!audioContextRef.current || !isVoiceOutputRef.current) {
      audioQueueRef.current = [];
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);

    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift()!;
      try {
        const ctx = audioContextRef.current;
        // Nova Sonic returns 16kHz signed 16-bit PCM
        const pcm16 = new Int16Array(chunk);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768;
        }
        const audioBuffer = ctx.createBuffer(1, float32.length, SAMPLE_RATE);
        audioBuffer.copyToChannel(float32, 0);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
      } catch {
        // Chunk decode error — skip and continue
      }
    }

    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // ──────────────────────────────────────────────────────
  // WebSocket connection to /api/voice/session
  // ──────────────────────────────────────────────────────

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = buildWsUrl(sessionIdRef.current);
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError('');
      reconnectDelayRef.current = WS_RECONNECT_DELAY_BASE_MS;
      // Signal server to initialise the Nova Sonic stream
      ws.send(JSON.stringify({ type: 'init' }));
    };

    ws.onmessage = (event) => {
      // JSON control messages
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data) as {
            type: string;
            [k: string]: any;
          };
          if (msg.type === 'ready') {
            // Server stream ready — no action needed
          } else if (msg.type === 'session_complete') {
            // Final transcript available — trigger text extraction via Nova 2 Lite
            if (msg.transcript) {
              void sendTranscript(msg.transcript);
            }
          } else if (msg.type === 'error') {
            setError(msg.message || 'Voice stream error');
          }
        } catch {
          // Ignore malformed JSON
        }
        return;
      }

      // Binary audio — Nova Sonic speech output
      if (event.data instanceof ArrayBuffer && isVoiceOutputRef.current) {
        audioQueueRef.current.push(event.data);
        void playNextChunk();
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      // Exponential backoff reconnect if recording is still active
      if (!isCompleteRef.current) {
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
      // onclose will fire after onerror — reconnect logic handles recovery
      setSupportMessage('Voice connection interrupted. Reconnecting…');
    };
  }, [playNextChunk]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────
  // Microphone + AudioWorklet capture
  // ──────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    setError('');

    try {
      // Initialise AudioContext
      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioContextRef.current = ctx;

      // Load the inline PCM capture worklet
      const blob = new Blob([AUDIO_WORKLET_CODE], {
        type: 'application/javascript',
      });
      const workletUrl = URL.createObjectURL(blob);
      await ctx.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      // Request microphone
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
      const worklet = new AudioWorkletNode(ctx, 'pcm-capture');
      workletNodeRef.current = worklet;
      source.connect(worklet);

      // Forward PCM frames to WebSocket
      worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(event.data);
        }
        // Live transcript preview (waveform word count heuristic)
        setTranscriptPreview((prev) =>
          prev.length < 120 ? prev + '…' : '…speaking…'
        );
      };

      setIsRecording(true);
    } catch (err: any) {
      const msg = err?.message || 'Unable to access microphone';
      setError(msg);
      setSupportMessage(
        'Microphone access denied. Use the text field instead.'
      );
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    setIsRecording(false);
    setTranscriptPreview('');
  }, []);

  const toggleMic = useCallback(() => {
    if (isRecording) stopRecording();
    else void startRecording();
  }, [isRecording, startRecording, stopRecording]);

  // ──────────────────────────────────────────────────────
  // Text transcript → Nova 2 Lite field extraction
  // (unchanged API contract with /api/intakes/conversation)
  // ──────────────────────────────────────────────────────

  const sendTranscript = useCallback(
    async (transcript: string) => {
      const trimmed = transcript.trim();
      if (!trimmed || isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setError('');
      setTranscriptPreview('');
      pushHistory('patient', trimmed);

      const outgoingHistory = [
        ...history,
        {
          id: `patient-${Date.now()}`,
          role: 'patient' as const,
          text: trimmed,
        },
      ];

      try {
        const response = await fetch('/api/intakes/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
          }),
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || 'Failed to process intake response');

        const nextTurn: IntakeTurn = data.turn;
        const updatedDraft = nextTurn.draft || draft;
        setDraft(updatedDraft);
        setAssistantMessage(nextTurn.assistantMessage);
        setDetectedLanguage(nextTurn.detectedLanguage || detectedLanguage);
        pushHistory('assistant', nextTurn.assistantMessage);

        // Send the assistant text to the WebSocket for Nova Sonic to vocalise
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'transcript_chunk',
              payload: { text: nextTurn.assistantMessage },
            })
          );
        }

        if (nextTurn.isComplete) {
          setIsComplete(true);
          // Signal end of intake session
          wsRef.current?.send(JSON.stringify({ type: 'end' }));
          sessionStorage.setItem(
            'intake-completion',
            JSON.stringify({
              summary: nextTurn.summary,
              draft: updatedDraft,
              language: nextTurn.detectedLanguage || detectedLanguage,
              doctorId,
              patientId,
            })
          );
          router.push('/intake/confirmation');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        pushHistory('assistant', 'I missed that. Could you please repeat?');
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [history, draft, detectedLanguage, doctorId, patientId, router, pushHistory]
  );

  // ──────────────────────────────────────────────────────
  // Lifecycle: Connect WS on mount, clean up on unmount
  // ──────────────────────────────────────────────────────

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      stopRecording();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────
  // Reset
  // ──────────────────────────────────────────────────────

  const resetConversation = useCallback(() => {
    stopRecording();
    wsRef.current?.close();
    sessionIdRef.current = generateSessionId();
    setDraft(initialDraft);
    setHistory([{ id: 'system-1', role: 'system', text: INITIAL_PROMPT }]);
    setAssistantMessage(INITIAL_PROMPT);
    setDetectedLanguage('English');
    setTranscriptPreview('');
    setIsComplete(false);
    setError('');
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    audioQueueRef.current = [];
    // Reconnect with a fresh session ID
    setTimeout(connectWebSocket, 500);
  }, [stopRecording, connectWebSocket]);

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
    sendTranscript,
    resetConversation,
    // Additional fields for UI
    isListening: isRecording,
  };
}
