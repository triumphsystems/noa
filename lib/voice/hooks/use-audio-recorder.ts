'use client';

import { useState, useRef, useCallback } from 'react';
import { SAMPLE_RATE, registerPcmWorklet } from '@/lib/voice/pcm-capture';
import { startBrowserSpeechRecognition } from '@/lib/voice/browser-speech';

interface AudioRecorderOptions {
  detectedLanguage: string;
  onPcmChunk: (chunk: ArrayBuffer) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onSpeechTurnComplete?: (text: string, isAuto: boolean) => void;
}

export function useAudioRecorder({
  detectedLanguage,
  onPcmChunk,
  onAudioStart,
  onAudioEnd,
  onSpeechTurnComplete,
}: AudioRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [error, setError] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const isRecordingRef = useRef(false);
  const recordingContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechBufferRef = useRef<string>('');
  const latestInterimRef = useRef<string>('');
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const hasSpokenInTurnRef = useRef<boolean>(false);

  const stopRecording = useCallback(
    (isAuto = false) => {
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

      onAudioEnd?.();

      if (turnText) {
        onSpeechTurnComplete?.(turnText, isAuto);
      }
    },
    [onAudioEnd, onSpeechTurnComplete]
  );

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    setError('');

    try {
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

      onAudioStart?.();

      worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        onPcmChunk(event.data);
      };

      // VAD Silence Detection Interval
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

        if (avgVolume > 14) {
          lastSpeechTimeRef.current = Date.now();
        }

        if (hasSpokenInTurnRef.current) {
          const elapsedSilence = Date.now() - lastSpeechTimeRef.current;
          if (elapsedSilence >= 1800) {
            stopRecording(true);
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
  }, [detectedLanguage, onAudioStart, onPcmChunk, stopRecording]);

  const toggleMic = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording(false);
    } else {
      void startRecording();
    }
  }, [startRecording, stopRecording]);

  const cleanupAudio = useCallback(() => {
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    recordingContextRef.current?.close().catch(() => {});
    recordingContextRef.current = null;
    isRecordingRef.current = false;
  }, []);

  return {
    isRecording,
    isRecordingRef,
    transcriptPreview,
    setTranscriptPreview,
    error,
    setError,
    supportMessage,
    setSupportMessage,
    startRecording,
    stopRecording,
    toggleMic,
    cleanupAudio,
  };
}
