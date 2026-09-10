'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import {
  AudioRecorderControl,
  ClinicalSuggestionsFeed,
  SoapNoteCard,
  TranscriptFeed,
  SessionHeader,
  SessionSuccessAlert,
  PatientContextCard,
  type TranscriptItem,
  type ClinicalSuggestionItem,
  type SOAPNoteData,
} from '@/components/session';
import { saveSession } from '@/app/dashboard/doctor/actions';
import type { Patient } from '@/lib/db';

interface SessionConsoleProps {
  initialPatients: Patient[];
  doctorId: string;
}

export function SessionConsole({
  initialPatients,
  doctorId,
}: SessionConsoleProps) {
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId') || '';

  const [isPendingSave, startTransition] = useTransition();
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [soapNote, setSoapNote] = useState<SOAPNoteData | null>(null);
  const [selectedPatient, setSelectedPatient] =
    useState<string>(initialPatientId);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [suggestions, setSuggestions] = useState<ClinicalSuggestionItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const setPatients = useDoctorStore((state) => state.setPatients);
  const setDoctorId = useDoctorStore((state) => state.setDoctorId);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const chunkIndexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const latestSpeechRef = useRef<string>('');
  const transcriptsRef = useRef<TranscriptItem[]>([]);

  // Sync server pre-fetched patients to store
  useEffect(() => {
    if (initialPatients.length > 0) {
      setPatients(initialPatients);
    }
    if (doctorId) {
      setDoctorId(doctorId);
    }
  }, [initialPatients, doctorId, setPatients, setDoctorId]);

  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);

  useEffect(() => {
    if (initialPatientId && !selectedPatient) {
      setSelectedPatient(initialPatientId);
    }
  }, [initialPatientId, selectedPatient]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const activePatient = useMemo(() => {
    return initialPatients.find((p) => p.id === selectedPatient) || null;
  }, [initialPatients, selectedPatient]);

  const activePatientName = useMemo(() => {
    if (!activePatient) return '';
    const parts = [activePatient.firstName, activePatient.lastName].filter(
      Boolean
    );
    return parts.length > 0
      ? parts.join(' ')
      : activePatient.email || `Patient #${activePatient.id.slice(-6)}`;
  }, [activePatient]);

  const getAISuggestions = async (
    transcript: string,
    activeSessionId?: string
  ) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/clinical/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          sessionId: activeSessionId || sessionId,
          patientId: selectedPatient,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.suggestions)) {
          setSuggestions((prev) => {
            const existingTexts = new Set(prev.map((s) => s.text));
            const newItems: ClinicalSuggestionItem[] = [];
            for (const s of data.suggestions) {
              if (typeof s === 'string' && !existingTexts.has(s)) {
                newItems.push({ text: s, priority: 'medium' });
              } else if (
                typeof s === 'object' &&
                s !== null &&
                'text' in s &&
                typeof (s as { text: unknown }).text === 'string'
              ) {
                const text = (s as { text: string }).text;
                const priority =
                  (s as { priority?: 'high' | 'medium' | 'low' }).priority ||
                  'medium';
                if (!existingTexts.has(text)) {
                  newItems.push({ text, priority });
                }
              }
            }
            return [...newItems, ...prev].slice(0, 8);
          });
        }
      }
    } catch (error) {
      console.warn('AI suggestions error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSOAPNote = useCallback(
    async (finalTranscript: string, targetSessionId?: string) => {
      if (!finalTranscript.trim()) return;
      setIsGenerating(true);
      try {
        const response = await fetch('/api/clinical/soap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: finalTranscript,
            patientId: selectedPatient,
            sessionId: targetSessionId || sessionId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.soapNote) {
            setSoapNote(data.soapNote);
          }
        }
      } catch (error) {
        console.error('SOAP Note generation error:', error);
      } finally {
        setIsGenerating(false);
      }
    },
    [selectedPatient, sessionId]
  );

  const uploadAndTranscribeAudioSlice = async (
    audioBlob: Blob,
    chunkIdx: number,
    activeSessionId: string
  ) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', audioBlob, `chunk_${chunkIdx}.webm`);
      uploadFormData.append('sessionId', activeSessionId);
      uploadFormData.append('chunkIndex', chunkIdx.toString());

      const uploadRes = await fetch('/api/consultation/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadRes.ok) return;
      const { s3Key } = await uploadRes.json();

      const transcribeRes = await fetch('/api/consultation/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          s3Key,
          sessionId: activeSessionId,
          chunkIndex: chunkIdx,
        }),
      });

      if (!transcribeRes.ok) return;
      const { transcript, role } = await transcribeRes.json();

      if (transcript && transcript.trim()) {
        const now = new Date();
        setTranscripts((prev) => [
          ...prev,
          {
            role: role || (chunkIdx % 2 === 0 ? 'doctor' : 'patient'),
            text: transcript.trim(),
            timestamp: now.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          },
        ]);

        void getAISuggestions(transcript, activeSessionId);
      }
    } catch (sliceErr) {
      console.warn('[Audio Pipeline] Slice processing error:', sliceErr);
    }
  };

  const startRecording = async () => {
    if (!selectedPatient) {
      alert('Please select a patient before starting the clinical encounter.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = stream;

      const newSessionId = `session-${Date.now()}`;
      setSessionId(newSessionId);
      setSaveSuccess(false);
      chunkIndexRef.current = 0;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const currentChunk = chunkIndexRef.current;
          chunkIndexRef.current += 1;
          void uploadAndTranscribeAudioSlice(
            event.data,
            currentChunk,
            newSessionId
          );
        }
      };

      mediaRecorder.onstop = () => {
        const allText = transcriptsRef.current
          .filter((t) => t.role !== 'system')
          .map((t) => t.text)
          .join(' ');

        const finalSpeech = (allText + ' ' + latestSpeechRef.current).trim();
        if (finalSpeech) {
          void generateSOAPNote(finalSpeech, newSessionId);
        }
      };

      mediaRecorder.start(6000);
      setIsRecording(true);

      if (typeof window !== 'undefined') {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
          try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
              let interimTranscript = '';
              let finalTranscript = '';

              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
                } else {
                  interimTranscript += event.results[i][0].transcript;
                }
              }

              if (finalTranscript) {
                latestSpeechRef.current = finalTranscript;
                const now = new Date();
                setTranscripts((prev) => [
                  ...prev,
                  {
                    role: 'doctor',
                    text: finalTranscript.trim(),
                    timestamp: now.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }),
                  },
                ]);
                void getAISuggestions(finalTranscript, newSessionId);
              }
            };

            recognition.onerror = (e: any) => {
              console.warn('SpeechRecognition error:', e);
            };

            recognition.start();
            recognitionRef.current = recognition;
          } catch (e) {
            console.warn('SpeechRecognition failed to start:', e);
          }
        }
      }

      timerRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording initialization error:', err);
      alert('Unable to access microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const now = new Date();
      setTranscripts((prev) => [
        ...prev,
        {
          role: 'system',
          text: 'Recording finished. Amazon Bedrock Nova is synthesizing the structured SOAP note and clinical assessment.',
          timestamp: now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        },
      ]);
    }
  };

  const handleSaveSession = async (customNote?: SOAPNoteData) => {
    if (!selectedPatient || transcripts.length === 0) {
      alert(
        'Please ensure a patient is selected and transcript data has been captured.'
      );
      return;
    }

    const noteToSave = customNote || soapNote;
    startTransition(async () => {
      const fullTranscript = transcripts
        .filter((t) => t.role !== 'system')
        .map((t) => `${t.role}: ${t.text}`)
        .join('\n');

      const res = await saveSession({
        sessionId: sessionId || undefined,
        patientId: selectedPatient,
        transcript: fullTranscript,
        soapNote: noteToSave || undefined,
      });

      if (res.success) {
        setSaveSuccess(true);
      } else {
        alert(res.error || 'Failed to save session record. Please try again.');
      }
    });
  };

  const resetForNewSession = () => {
    setTranscripts([]);
    setSoapNote(null);
    setSuggestions([]);
    setSessionDuration(0);
    setSessionId('');
    setSaveSuccess(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 font-sans sm:p-6 lg:p-8">
      <SessionHeader
        activePatient={activePatient}
        activePatientName={activePatientName}
      />

      {saveSuccess && (
        <SessionSuccessAlert
          activePatient={activePatient}
          activePatientName={activePatientName}
          onReset={resetForNewSession}
        />
      )}

      <PatientContextCard
        patients={initialPatients}
        selectedPatient={selectedPatient}
        onSelectPatient={(id) => {
          setSelectedPatient(id);
          setSaveSuccess(false);
        }}
        isRecording={isRecording}
        activePatient={activePatient}
      />

      <AudioRecorderControl
        isRecording={isRecording}
        sessionDuration={sessionDuration}
        selectedPatient={selectedPatient}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-6">
          <TranscriptFeed transcripts={transcripts} isRecording={isRecording} />
        </div>

        <div className="space-y-6">
          <ClinicalSuggestionsFeed
            suggestions={suggestions}
            isGenerating={isGenerating}
          />

          <SoapNoteCard
            soapNote={soapNote}
            isGenerating={isGenerating}
            isSaving={isPendingSave}
            onSave={handleSaveSession}
            onUpdateNote={setSoapNote}
          />
        </div>
      </div>
    </div>
  );
}
