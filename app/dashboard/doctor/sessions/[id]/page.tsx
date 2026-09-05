'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import {
  ArrowLeft,
  Clock,
  Download,
  Edit3,
  FileText,
  Mic,
  Save,
  User,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import type { Session, Patient, SoapNote } from '@/lib/db';

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const unwrappedParams = React.use(
    params instanceof Promise ? params : Promise.resolve(params)
  );
  const sessionId = unwrappedParams.id;

  const doctor = useDoctorStore((state) => state.doctor);
  const storeSessions = useDoctorStore((state) => state.sessions);
  const storePatients = useDoctorStore((state) => state.patients);

  const [session, setSession] = React.useState<Session | null>(null);
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'soap' | 'transcript'>(
    'soap'
  );
  const [editingNote, setEditingNote] = React.useState(false);
  const [soapNote, setSoapNote] = React.useState<SoapNote>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    generatedAt: Date.now(),
  });

  React.useEffect(() => {
    async function loadSession() {
      setIsLoading(true);
      setError(null);
      try {
        let found = storeSessions.find((s) => s.id === sessionId) || null;
        if (!found) {
          const res = await fetch(
            `/api/sessions?sessionId=${encodeURIComponent(sessionId)}`
          );
          const data = await res.json();
          if (!res.ok)
            throw new Error(
              data.message || data.error || 'Failed to fetch session'
            );
          found = data.session || null;
        }

        if (!found) throw new Error('Session not found');
        setSession(found);

        if (found.soapNote) {
          setSoapNote(found.soapNote);
        } else {
          setSoapNote({
            subjective: found.transcript || '',
            objective: '',
            assessment: '',
            plan: '',
            generatedAt: Date.now(),
          });
        }

        // Fetch patient
        if (found.patientId) {
          let p =
            storePatients.find((item) => item.id === found!.patientId) || null;
          if (!p) {
            const pRes = await fetch(
              `/api/patients/${encodeURIComponent(found.patientId)}`
            );
            const pData = await pRes.json();
            if (pRes.ok && pData.patient) p = pData.patient;
          }
          setPatient(p);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading session');
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionId) {
      void loadSession();
    }
  }, [sessionId, storeSessions, storePatients]);

  const handleSaveSOAP = async () => {
    if (!session) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          doctorId: session.doctorId,
          patientId: session.patientId,
          soapNote,
          transcript: session.transcript,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || data.message || 'Failed to save clinical note'
        );
      setEditingNote(false);
      if (data.session) {
        setSession(data.session);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-slate mx-auto flex max-w-5xl flex-col items-center gap-3 p-12 text-center text-sm">
        <Loader2 className="text-deep-ink/50 h-6 w-6 animate-spin" />
        <span>Loading session consultation...</span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Link
          href="/dashboard/doctor"
          className="text-slate hover:text-deep-ink flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-900 sm:text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error || 'Session could not be found.'}</span>
        </div>
      </div>
    );
  }

  const patientNameParts = patient
    ? [patient.firstName, patient.lastName].filter(Boolean)
    : [];
  const patientName =
    patientNameParts.length > 0
      ? patientNameParts.join(' ').trim()
      : (patient as any)?.name ||
        patient?.email ||
        `Patient #${session.patientId.slice(-6)}`;
  const doctorName = doctor?.name
    ? `Dr. ${doctor.name}`
    : 'Attending Physician';
  const sessionDate = session.startedAt
    ? new Date(session.startedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Recent';

  // Calculate duration
  let durationStr = 'Completed';
  if (session.startedAt && session.endedAt) {
    const mins = Math.max(
      1,
      Math.round((session.endedAt - session.startedAt) / 60000)
    );
    durationStr = `${mins} min${mins === 1 ? '' : 's'}`;
  }

  // Split transcript if stored as text
  const transcriptLines = session.transcript
    ? session.transcript
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Navigation & Actions */}
      <div className="space-y-1">
        <Link
          href="/dashboard/doctor"
          className="text-slate hover:text-deep-ink mb-2 flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-deep-ink font-serif text-2xl font-bold sm:text-3xl">
              Session Consultation
            </h1>
            <p className="text-slate text-xs sm:text-sm">
              Session ID: {session.id} · {sessionDate}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="border-deep-ink/20 text-deep-ink hover:bg-soft-meadow w-full cursor-pointer gap-1.5 rounded-full text-xs sm:w-auto sm:text-sm"
          >
            <Download className="h-4 w-4" />
            Print Note
          </Button>
        </div>
      </div>

      {/* Session Metadata KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Patient"
          value={patientName}
          icon={<User className="text-slate h-5 w-5" />}
        />
        <StatCard
          label="Provider"
          value={doctorName}
          icon={<FileText className="text-slate h-5 w-5" />}
        />
        <StatCard
          label="Duration"
          value={durationStr}
          icon={<Clock className="text-slate h-5 w-5" />}
        />
      </div>

      {/* Main Tabs Container */}
      <Card className="p-4 sm:p-6">
        {/* Tab Controls */}
        <div className="border-deep-ink/10 mb-6 flex gap-2 overflow-x-auto border-b pb-4">
          <button
            onClick={() => setActiveTab('soap')}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:px-5 ${
              activeTab === 'soap'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>SOAP Clinical Note</span>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:px-5 ${
              activeTab === 'transcript'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Voice Transcript ({transcriptLines.length})</span>
          </button>
        </div>

        {/* SOAP Note Tab */}
        {activeTab === 'soap' && (
          <div className="space-y-6">
            {!editingNote ? (
              <>
                <div className="space-y-4">
                  <div className="bg-soft-meadow/50 border-deep-ink/5 rounded-2xl border p-4">
                    <span className="text-slate mb-1 block text-xs font-semibold tracking-wider uppercase">
                      Subjective
                    </span>
                    <p className="text-deep-ink text-sm leading-relaxed">
                      {soapNote.subjective || (
                        <span className="text-slate italic">None recorded</span>
                      )}
                    </p>
                  </div>

                  <div className="bg-soft-meadow/50 border-deep-ink/5 rounded-2xl border p-4">
                    <span className="text-slate mb-1 block text-xs font-semibold tracking-wider uppercase">
                      Objective
                    </span>
                    <p className="text-deep-ink text-sm leading-relaxed">
                      {soapNote.objective || (
                        <span className="text-slate italic">None recorded</span>
                      )}
                    </p>
                  </div>

                  <div className="bg-soft-meadow/50 border-deep-ink/5 rounded-2xl border p-4">
                    <span className="text-slate mb-1 block text-xs font-semibold tracking-wider uppercase">
                      Assessment
                    </span>
                    <p className="text-deep-ink text-sm leading-relaxed">
                      {soapNote.assessment || (
                        <span className="text-slate italic">None recorded</span>
                      )}
                    </p>
                  </div>

                  <div className="bg-soft-meadow/50 border-deep-ink/5 rounded-2xl border p-4">
                    <span className="text-slate mb-1 block text-xs font-semibold tracking-wider uppercase">
                      Plan
                    </span>
                    <p className="text-deep-ink text-sm leading-relaxed">
                      {soapNote.plan || (
                        <span className="text-slate italic">None recorded</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="border-deep-ink/10 flex gap-3 border-t pt-4">
                  <Button
                    onClick={() => setEditingNote(true)}
                    className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 cursor-pointer gap-1.5 rounded-full text-xs font-medium shadow-2xs"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Clinical Note
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-slate mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                    Subjective
                  </label>
                  <textarea
                    value={soapNote.subjective}
                    onChange={(e) =>
                      setSoapNote({ ...soapNote, subjective: e.target.value })
                    }
                    className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-2xl border bg-transparent p-3 text-base focus:ring-2 focus:outline-none sm:text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-slate mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                    Objective
                  </label>
                  <textarea
                    value={soapNote.objective}
                    onChange={(e) =>
                      setSoapNote({ ...soapNote, objective: e.target.value })
                    }
                    className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-2xl border bg-transparent p-3 text-base focus:ring-2 focus:outline-none sm:text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-slate mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                    Assessment
                  </label>
                  <textarea
                    value={soapNote.assessment}
                    onChange={(e) =>
                      setSoapNote({ ...soapNote, assessment: e.target.value })
                    }
                    className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-2xl border bg-transparent p-3 text-base focus:ring-2 focus:outline-none sm:text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-slate mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                    Plan
                  </label>
                  <textarea
                    value={soapNote.plan}
                    onChange={(e) =>
                      setSoapNote({ ...soapNote, plan: e.target.value })
                    }
                    className="border-deep-ink/20 text-deep-ink focus:ring-hi-yellow w-full rounded-2xl border bg-transparent p-3 text-base focus:ring-2 focus:outline-none sm:text-sm"
                    rows={3}
                  />
                </div>

                <div className="border-deep-ink/10 flex gap-3 border-t pt-4">
                  <Button
                    onClick={handleSaveSOAP}
                    disabled={isSaving}
                    className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 cursor-pointer gap-1.5 rounded-full text-xs font-medium shadow-2xs"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => setEditingNote(false)}
                    variant="outline"
                    className="border-deep-ink/20 text-deep-ink hover:bg-soft-meadow cursor-pointer gap-1.5 rounded-full text-xs"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transcript Tab */}
        {activeTab === 'transcript' && (
          <div className="space-y-3">
            {transcriptLines.length === 0 ? (
              <div className="text-slate py-8 text-center text-xs">
                No recorded transcript available for this consultation.
              </div>
            ) : (
              transcriptLines.map((line, idx) => (
                <div
                  key={idx}
                  className="bg-soft-meadow/40 border-deep-ink/5 flex items-start gap-3 rounded-2xl border p-3"
                >
                  <Badge
                    variant="secondary"
                    className="shrink-0 px-2.5 py-0.5 text-[10px]"
                  >
                    Speaker
                  </Badge>
                  <div className="flex-1">
                    <p className="text-deep-ink text-sm leading-relaxed">
                      {line}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
