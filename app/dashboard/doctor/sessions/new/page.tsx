'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  Suspense,
  useMemo,
} from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AudioRecorderControl } from '@/components/session/audio-recorder-control';
import {
  TranscriptFeed,
  type TranscriptItem,
} from '@/components/session/transcript-feed';
import {
  ClinicalSuggestionsFeed,
  type ClinicalSuggestionItem,
} from '@/components/session/clinical-suggestions-feed';
import {
  SoapNoteCard,
  type SOAPNoteData,
} from '@/components/session/soap-note-card';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import { ArrowLeft, User, CheckCircle2, ShieldAlert } from 'lucide-react';

function SessionPageContent() {
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId') || '';

  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [soapNote, setSoapNote] = useState<SOAPNoteData | null>(null);
  const [selectedPatient, setSelectedPatient] =
    useState<string>(initialPatientId);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [suggestions, setSuggestions] = useState<ClinicalSuggestionItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const doctorId = useDoctorStore((state) => state.doctorId);
  const patients = useDoctorStore((state) => state.patients);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const chunkIndexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const latestSpeechRef = useRef<string>('');
  const transcriptsRef = useRef<TranscriptItem[]>([]);

  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);

  // Sync initial query param if present
  useEffect(() => {
    if (initialPatientId && !selectedPatient) {
      setSelectedPatient(initialPatientId);
    }
  }, [initialPatientId, selectedPatient]);

  // Ensure doctor data is loaded
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedDoctorId = window.localStorage.getItem('doctorId') || doctorId;
    if (storedDoctorId && patients.length === 0) {
      void loadDashboard(storedDoctorId);
    }
  }, [doctorId, patients.length, loadDashboard]);

  // Cleanup timer & audio stream on unmount
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
    return patients.find((p) => p.id === selectedPatient) || null;
  }, [patients, selectedPatient]);

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
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(
            data.suggestions.map((text: string, idx: number) => ({
              text,
              priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error fetching clinical suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSOAPNote = useCallback(
    async (currentTranscripts: TranscriptItem[], activeSessionId?: string) => {
      setIsGenerating(true);
      try {
        const fullTranscript = currentTranscripts
          .filter((t) => t.role !== 'system')
          .map((t) => `${t.role}: ${t.text}`)
          .join('\n');

        if (!fullTranscript.trim()) return;

        const response = await fetch('/api/clinical/soap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: fullTranscript,
            sessionId: activeSessionId || sessionId,
            patientId: selectedPatient,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSoapNote(data.soapNote);
        }
      } catch (error) {
        console.error('Error generating SOAP note:', error);
      } finally {
        setIsGenerating(false);
      }
    },
    [sessionId, selectedPatient]
  );

  const uploadAudioChunk = async (
    chunk: Blob,
    currentSessionId: string,
    currentChunkIndex: number
  ) => {
    const formData = new FormData();
    formData.append('audio', chunk, `chunk-${currentChunkIndex}.webm`);
    formData.append('sessionId', currentSessionId);
    formData.append(
      'doctorId',
      doctorId ||
        (typeof window !== 'undefined'
          ? window.localStorage.getItem('doctorId') || ''
          : '')
    );
    formData.append('patientId', selectedPatient);
    formData.append('chunkIndex', currentChunkIndex.toString());
    formData.append('clientTranscript', latestSpeechRef.current);
    latestSpeechRef.current = '';

    try {
      const res = await fetch('/api/sessions/voice', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (
          data.chunkTranscript &&
          data.chunkTranscript.trim() &&
          !recognitionRef.current
        ) {
          const now = new Date();
          setTranscripts((prev) => [
            ...prev,
            {
              role: 'patient',
              text: data.chunkTranscript.trim(),
              timestamp: now.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
            },
          ]);
        }

        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(
            data.suggestions.map((text: string, idx: number) => ({
              text,
              priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
            }))
          );
        }
      }
    } catch (err) {
      console.warn(
        `[Rolling Audio] Chunk ${currentChunkIndex} upload warning:`,
        err
      );
    }
  };

  const startRecording = async () => {
    if (!selectedPatient) {
      alert('Please select a patient record first.');
      return;
    }

    try {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setSessionId(newSessionId);
      chunkIndexRef.current = 0;
      setSaveSuccess(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          const currentIndex = chunkIndexRef.current++;
          void uploadAudioChunk(event.data, newSessionId, currentIndex);
        }
      };

      mediaRecorder.onstop = () => {
        void generateSOAPNote(transcriptsRef.current, newSessionId);
      };

      mediaRecorder.start(10000);
      setIsRecording(true);
      setSessionDuration(0);

      if (typeof window !== 'undefined') {
        const Win = window as any;
        const SpeechRecognitionCtor =
          Win.SpeechRecognition || Win.webkitSpeechRecognition;
        if (SpeechRecognitionCtor) {
          try {
            const recognition = new SpeechRecognitionCtor();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
              const lastResult = event.results[event.results.length - 1];
              if (lastResult && lastResult[0]?.transcript) {
                const text = lastResult[0].transcript.trim();
                if (text) {
                  latestSpeechRef.current = text;
                  const now = new Date();
                  setTranscripts((prev) => [
                    ...prev,
                    {
                      role: 'patient',
                      text,
                      timestamp: now.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      }),
                    },
                  ]);

                  if (text.length > 20) {
                    void getAISuggestions(text, newSessionId);
                  }
                }
              }
            };

            recognition.onerror = (err: any) => {
              console.warn('[Web Speech] Recognition error:', err);
            };

            recognition.start();
            recognitionRef.current = recognition;
          } catch (speechErr) {
            console.warn(
              '[Web Speech] Could not start speech recognition:',
              speechErr
            );
          }
        }
      }

      timerRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);

      const now = new Date();
      setTranscripts((prev) => [
        ...prev,
        {
          role: 'system',
          text: `Consultation started with ${activePatientName || 'Patient'}. Bedrock Nova AI clinical streaming active.`,
          timestamp: now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        },
      ]);
    } catch (error) {
      console.error('Microphone access error:', error);
      alert(
        'Unable to access microphone. Please check your browser audio permissions.'
      );
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

    setIsSaving(true);
    try {
      const activeDoctorId =
        doctorId ||
        (typeof window !== 'undefined'
          ? window.localStorage.getItem('doctorId') || ''
          : '');

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          doctorId: activeDoctorId,
          patientId: selectedPatient,
          transcript: transcripts
            .filter((t) => t.role !== 'system')
            .map((t) => `${t.role}: ${t.text}`)
            .join('\n'),
          transcripts,
          soapNote: noteToSave,
          duration: sessionDuration,
        }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        if (doctorId) {
          void loadDashboard(doctorId);
        }
      } else {
        alert('Failed to save session record. Please try again.');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Error connecting to session API.');
    } finally {
      setIsSaving(false);
    }
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
      {/* Top Header & Breadcrumb */}
      <div className="space-y-1.5">
        <div className="text-slate mb-1 flex items-center gap-2 text-xs font-semibold">
          <Link
            href="/dashboard/doctor"
            className="hover:text-deep-ink flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <span>/</span>
          {activePatient ? (
            <Link
              href={`/dashboard/doctor/patients/${activePatient.id}`}
              className="hover:text-deep-ink max-w-xs truncate transition-colors"
            >
              {activePatientName}
            </Link>
          ) : (
            <span className="text-deep-ink">Consultation</span>
          )}
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-deep-ink font-serif text-2xl font-bold sm:text-3xl">
              Clinical Voice Consultation
            </h1>
            <p className="text-slate text-xs sm:text-sm">
              Live doctor-patient encounter with ambient speech recognition,
              clinical guidance, and automated SOAP documentation
            </p>
          </div>

          {activePatient && (
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/doctor/patients/${activePatient.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer gap-1.5 rounded-full text-xs font-medium"
                >
                  <User className="h-3.5 w-3.5" />
                  View Patient Chart
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="animate-in fade-in flex flex-col justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold sm:text-sm">
                Consultation Record Saved Successfully!
              </p>
              <p className="text-xs text-emerald-800">
                The SOAP note and dialogue transcript have been archived to{' '}
                {activePatientName}&apos;s clinical chart.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              onClick={resetForNewSession}
              size="sm"
              className="cursor-pointer rounded-full bg-emerald-600 text-xs text-white hover:bg-emerald-700"
            >
              Start Another Session
            </Button>
            {activePatient && (
              <Link href={`/dashboard/doctor/patients/${activePatient.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer rounded-full border-emerald-300 text-xs"
                >
                  Open Patient Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Patient Selection & Clinical Context Card */}
      <Card className="border-deep-ink/8 shadow-editorial border bg-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-2">
            <label className="text-slate block text-xs font-bold tracking-wider uppercase">
              Selected Patient Record
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPatient}
                onChange={(e) => {
                  setSelectedPatient(e.target.value);
                  setSaveSuccess(false);
                }}
                disabled={isRecording}
                className="border-deep-ink/15 text-deep-ink focus:ring-hi-yellow w-full cursor-pointer rounded-xl border bg-white px-3.5 py-2.5 text-xs shadow-2xs transition-colors focus:ring-2 focus:outline-none disabled:opacity-60 sm:w-80 sm:text-sm"
              >
                <option value="">Select a patient from your registry...</option>
                {patients.map((p) => {
                  const pName =
                    [p.firstName, p.lastName].filter(Boolean).join(' ') ||
                    p.email ||
                    `Patient #${p.id.slice(-6)}`;
                  return (
                    <option key={p.id} value={p.id}>
                      {pName} ({p.email || p.id.slice(0, 8)})
                    </option>
                  );
                })}
              </select>

              {activePatient && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    ID: {activePatient.id.slice(0, 8)}...
                  </Badge>
                  {activePatient.linkStatus === 'pending_patient_approval' && (
                    <Badge
                      variant="secondary"
                      className="border-amber-200 bg-amber-50 text-xs text-amber-800"
                    >
                      Pending Consent
                    </Badge>
                  )}
                  {activePatient.linkStatus === 'linked' && (
                    <Badge variant="success" className="text-xs">
                      Practice Connected
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {activePatient && (
            <div className="border-deep-ink/10 flex items-center gap-4 border-t pt-3 text-xs lg:border-t-0 lg:pt-0">
              <div>
                <span className="text-slate block text-[11px]">
                  Date of Birth
                </span>
                <span className="text-deep-ink font-semibold">
                  {activePatient.dateOfBirth || '—'}
                </span>
              </div>
              <div className="bg-deep-ink/10 hidden h-6 w-px sm:block" />
              <div>
                <span className="text-slate block text-[11px]">Gender</span>
                <span className="text-deep-ink font-semibold capitalize">
                  {activePatient.gender || '—'}
                </span>
              </div>
              <div className="bg-deep-ink/10 hidden h-6 w-px sm:block" />
              <div>
                <span className="text-slate block text-[11px]">Conditions</span>
                <span className="text-deep-ink font-semibold">
                  {activePatient.conditions?.length || 0} active
                </span>
              </div>
            </div>
          )}
        </div>

        {activePatient &&
        (activePatient.conditions?.length ||
          activePatient.allergies?.length) ? (
          <div className="border-deep-ink/8 mt-4 grid grid-cols-1 gap-3 border-t pt-4 text-xs sm:grid-cols-2">
            {activePatient.conditions &&
              activePatient.conditions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate font-medium">History:</span>
                  {activePatient.conditions.map((cond, i) => (
                    <span
                      key={i}
                      className="bg-soft-meadow text-deep-ink rounded-md px-2 py-0.5 text-[11px]"
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              )}
            {activePatient.allergies && activePatient.allergies.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 font-medium text-rose-700">
                  <ShieldAlert className="h-3 w-3" /> Allergies:
                </span>
                {activePatient.allergies.map((allergy, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Card>

      {/* Primary Audio Recording Console */}
      <AudioRecorderControl
        isRecording={isRecording}
        sessionDuration={sessionDuration}
        selectedPatient={selectedPatient}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      {/* Balanced 2-Column Clinical Workspace */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Left Column: Real-Time Consultation Dialogue */}
        <div className="space-y-6">
          <TranscriptFeed transcripts={transcripts} isRecording={isRecording} />
        </div>

        {/* Right Column: Real-time Copilot & Synthesized SOAP Documentation */}
        <div className="space-y-6">
          <ClinicalSuggestionsFeed
            suggestions={suggestions}
            isGenerating={isGenerating}
          />

          <SoapNoteCard
            soapNote={soapNote}
            isGenerating={isGenerating}
            isSaving={isSaving}
            onSave={handleSaveSession}
            onUpdateNote={setSoapNote}
          />
        </div>
      </div>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="text-slate mx-auto max-w-5xl p-12 text-center text-sm">
          Loading consultation console...
        </div>
      }
    >
      <SessionPageContent />
    </Suspense>
  );
}
