'use client';

import * as React from 'react';
import { useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
} from 'lucide-react';
import { saveSession } from '@/app/dashboard/doctor/actions';
import type { Session, Patient, Doctor, SoapNote } from '@/lib/db';

export interface SessionDetailProps {
  initialSession: Session;
  initialPatient: Patient | null;
  doctor: Doctor | null;
}

export function SessionDetail({
  initialSession,
  initialPatient,
  doctor,
}: SessionDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [session, setSession] = React.useState<Session>(initialSession);
  const [activeTab, setActiveTab] = React.useState<'soap' | 'transcript'>('soap');
  const [editingNote, setEditingNote] = React.useState(false);

  const [soapNote, setSoapNote] = React.useState<SoapNote>(
    initialSession.soapNote || {
      subjective: initialSession.transcript || '',
      objective: '',
      assessment: '',
      plan: '',
      generatedAt: Date.now(),
    }
  );

  const handleSaveSOAP = () => {
    startTransition(async () => {
      const res = await saveSession({
        sessionId: session.id,
        patientId: session.patientId,
        transcript: session.transcript,
        soapNote,
      });

      if (res.success) {
        setEditingNote(false);
        setSession((prev) => ({
          ...prev,
          soapNote,
          updatedAt: Date.now(),
        }));
      } else {
        alert(res.error || 'Failed to save clinical note');
      }
    });
  };

  const patientNameParts = initialPatient
    ? [initialPatient.firstName, initialPatient.lastName].filter(Boolean)
    : [];
  const patientName =
    patientNameParts.length > 0
      ? patientNameParts.join(' ').trim()
      : initialPatient?.email ||
        `Patient #${session.patientId.slice(-6)}`;
  const doctorName = doctor?.name ? `Dr. ${doctor.name}` : 'Attending Physician';
  const sessionDate = session.startedAt
    ? new Date(session.startedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Recent';

  let durationStr = 'Completed';
  if (session.startedAt && session.endedAt) {
    const mins = Math.max(
      1,
      Math.round((session.endedAt - session.startedAt) / 60000)
    );
    durationStr = `${mins} min${mins === 1 ? '' : 's'}`;
  }

  const transcriptLines = session.transcript
    ? session.transcript
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 font-sans sm:p-6 lg:p-8">
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
                    disabled={isPending}
                    className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 cursor-pointer gap-1.5 rounded-full text-xs font-medium shadow-2xs"
                  >
                    {isPending ? (
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
