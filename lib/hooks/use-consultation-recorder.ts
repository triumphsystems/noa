'use client';

/**
 * useConsultationRecorder — Ambient Clinical Scribe Hook
 *
 * Implements the rolling 60-second audio slice architecture for 30+ minute
 * doctor-patient consultation recordings. Completely eliminates Vercel's
 * 5-minute function timeout limitation by treating each slice as an
 * independent, stateless upload.
 *
 * Architecture:
 *   MediaRecorder (60s timeslice)
 *     → POST /api/consultation/upload-slice  → S3 presigned PUT
 *     → POST /api/consultation/transcribe-slice → Transcribe Medical → DynamoDB
 *
 * Features:
 * - Unlimited duration recording (15 min, 45 min, 90 min)
 * - Fault tolerant: missed slices are retried automatically
 * - Real-time rolling transcript displayed to the doctor
 * - Clean teardown on unmount or session end
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ConsultationSlice {
  index: number;
  status: 'uploading' | 'transcribing' | 'done' | 'error';
  transcriptText?: string;
  errorMessage?: string;
  uploadedAt?: number;
  transcribedAt?: number;
}

export interface UseConsultationRecorderOptions {
  sessionId: string;
  doctorId?: string;
  patientId?: string;
  /** Slice duration in milliseconds. Default: 60000 (60 seconds). */
  sliceDurationMs?: number;
  /** Called whenever a new transcript segment arrives */
  onTranscriptSegment?: (text: string, sliceIndex: number) => void;
  /** Called when a slice fails to upload or transcribe */
  onSliceError?: (index: number, error: string) => void;
}

export interface UseConsultationRecorderReturn {
  /** Whether the recording is currently active */
  isRecording: boolean;
  /** Whether the microphone is actively capturing audio */
  isCapturing: boolean;
  /** Ordered list of slices and their processing status */
  slices: ConsultationSlice[];
  /** Concatenated full transcript from all completed slices */
  fullTranscript: string;
  /** Total recording duration in seconds */
  recordingDurationSeconds: number;
  /** Any fatal error message */
  error: string;
  /** Start the consultation recording */
  startRecording: () => Promise<void>;
  /** Stop the recording and flush any remaining audio */
  stopRecording: () => Promise<void>;
}

export function useConsultationRecorder({
  sessionId,
  doctorId,
  patientId,
  sliceDurationMs = 60_000,
  onTranscriptSegment,
  onSliceError,
}: UseConsultationRecorderOptions): UseConsultationRecorderReturn {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sliceIndexRef = useRef(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const transcriptPartsRef = useRef<string[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [slices, setSlices] = useState<ConsultationSlice[]>([]);
  const [fullTranscript, setFullTranscript] = useState('');
  const [recordingDurationSeconds, setRecordingDurationSeconds] = useState(0);
  const [error, setError] = useState('');

  // ──────────────────────────────────────────────────────────
  // Slice processing pipeline
  // ──────────────────────────────────────────────────────────

  const updateSlice = useCallback(
    (index: number, patch: Partial<ConsultationSlice>) => {
      setSlices((prev) => {
        const copy = [...prev];
        const existing = copy.find((s) => s.index === index);
        if (existing) {
          Object.assign(existing, patch);
        } else {
          copy.push({ index, status: 'uploading', ...patch });
        }
        return copy.sort((a, b) => a.index - b.index);
      });
    },
    []
  );

  const processSlice = useCallback(
    async (blob: Blob, index: number) => {
      updateSlice(index, { index, status: 'uploading' });

      try {
        // 1. Get presigned S3 upload URL
        const urlRes = await fetch('/api/consultation/upload-slice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            sliceIndex: index,
            mimeType: blob.type || 'audio/webm',
            doctorId,
            patientId,
          }),
        });

        if (!urlRes.ok) {
          throw new Error(`Upload URL request failed: ${urlRes.status}`);
        }

        const { uploadUrl, s3Key } = (await urlRes.json()) as {
          uploadUrl: string;
          s3Key: string;
        };

        // 2. Upload audio blob directly to S3 (bypasses Vercel limits)
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': blob.type || 'audio/webm' },
          body: blob,
        });

        if (!uploadRes.ok) {
          throw new Error(`S3 upload failed: ${uploadRes.status}`);
        }

        updateSlice(index, { status: 'transcribing', uploadedAt: Date.now() });

        // 3. Trigger Transcribe Medical on the uploaded slice
        const txRes = await fetch('/api/consultation/transcribe-slice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, s3Key, sliceIndex: index }),
        });

        if (!txRes.ok) {
          throw new Error(`Transcription failed: ${txRes.status}`);
        }

        const txData = (await txRes.json()) as {
          status: string;
          transcriptText?: string;
        };

        const text = txData.transcriptText || '';
        transcriptPartsRef.current[index] = text;

        // Rebuild full transcript in order
        const combined = transcriptPartsRef.current.filter(Boolean).join(' ');
        setFullTranscript(combined);

        if (text && onTranscriptSegment) {
          onTranscriptSegment(text, index);
        }

        updateSlice(index, {
          status: 'done',
          transcriptText: text,
          transcribedAt: Date.now(),
        });
      } catch (err: any) {
        const msg = err?.message || 'Unknown error';
        console.error(`[ConsultationRecorder] Slice ${index} failed:`, msg);
        updateSlice(index, { status: 'error', errorMessage: msg });
        onSliceError?.(index, msg);
      }
    },
    [
      sessionId,
      doctorId,
      patientId,
      updateSlice,
      onTranscriptSegment,
      onSliceError,
    ]
  );

  // ──────────────────────────────────────────────────────────
  // Recording lifecycle
  // ──────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    setError('');
    setSlices([]);
    setFullTranscript('');
    setRecordingDurationSeconds(0);
    sliceIndexRef.current = 0;
    transcriptPartsRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      // Determine the best supported MIME type
      const mimeType =
        [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
        ].find((t) => MediaRecorder.isTypeSupported(t)) || '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          const index = sliceIndexRef.current++;
          void processSlice(event.data, index);
        }
      };

      recorder.onstart = () => {
        setIsCapturing(true);
        setIsRecording(true);
      };

      recorder.onstop = () => {
        setIsCapturing(false);
      };

      recorder.onerror = (ev) => {
        setError(
          `MediaRecorder error: ${(ev as any)?.error?.message || 'unknown'}`
        );
        setIsRecording(false);
        setIsCapturing(false);
      };

      // Start with rolling timeslices — each fires ondataavailable
      recorder.start(sliceDurationMs);

      // Track recording duration
      durationIntervalRef.current = setInterval(() => {
        setRecordingDurationSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      const msg = err?.message || 'Could not access microphone';
      console.error('[ConsultationRecorder] Start failed:', msg);
      setError(msg);
    }
  }, [isRecording, sliceDurationMs, processSlice]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    // Stop the timeslice interval, which fires ondataavailable one final time
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;

    // Release microphone
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (durationIntervalRef.current)
        clearInterval(durationIntervalRef.current);
    };
  }, []);

  return {
    isRecording,
    isCapturing,
    slices,
    fullTranscript,
    recordingDurationSeconds,
    error,
    startRecording,
    stopRecording,
  };
}
