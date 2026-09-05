'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, FileText, ArrowRight, User, Loader2, RefreshCw } from 'lucide-react';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import type { Session, Patient } from '@/lib/db';

export default function SummariesPage() {
  const doctorId = useDoctorStore((state) => state.doctorId);
  const sessions = useDoctorStore((state) => state.sessions);
  const patients = useDoctorStore((state) => state.patients);
  const isLoading = useDoctorStore((state) => state.isLoading);
  const error = useDoctorStore((state) => state.error);
  const lastLoadedDoctorId = useDoctorStore((state) => state.lastLoadedDoctorId);
  const loadDashboard = useDoctorStore((state) => state.loadDashboard);

  const [filterStatus, setFilterStatus] = useState<
    'all' | 'completed' | 'active'
  >('all');

  useEffect(() => {
    let resolvedDoctorId = doctorId;
    if (!resolvedDoctorId && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('doctorId');
      if (stored) {
        resolvedDoctorId = stored;
        useDoctorStore.getState().setDoctorId(stored);
      }
    }

    // Only load once when doctorId is known and we haven't loaded for this doctorId yet
    if (resolvedDoctorId && lastLoadedDoctorId !== resolvedDoctorId && !isLoading) {
      void loadDashboard(resolvedDoctorId);
    }
  }, [doctorId, lastLoadedDoctorId, isLoading, loadDashboard]);

  const handleRefresh = () => {
    const activeId = doctorId || (typeof window !== 'undefined' ? window.localStorage.getItem('doctorId') : null);
    if (activeId) {
      void loadDashboard(activeId);
    }
  };

  // Map patientId -> Patient
  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  // Filter sessions that have SOAP notes, transcripts, or completed/active consultations
  const sessionsWithSummaries = useMemo(() => {
    return sessions.filter(
      (s) => Boolean(s.soapNote) || Boolean(s.transcript) || s.status === 'completed' || s.status === 'active'
    );
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (filterStatus === 'all') return sessionsWithSummaries;
    return sessionsWithSummaries.filter((s) => s.status === filterStatus);
  }, [sessionsWithSummaries, filterStatus]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-deep-ink mb-1 font-serif text-2xl font-bold sm:text-3xl">
            Clinical Summaries
          </h1>
          <p className="text-slate text-xs sm:text-sm">
            Review, verify, and export live consultation notes and SOAP assessments
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="rounded-xl border-deep-ink/15 text-xs font-semibold gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="underline font-semibold ml-2 hover:text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'completed', 'active'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors sm:px-5 ${
              filterStatus === status
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Summaries Grid */}
      {isLoading ? (
        <div className="text-slate mx-auto flex max-w-5xl flex-col items-center gap-3 p-12 text-center text-sm">
          <Loader2 className="text-deep-ink/50 h-6 w-6 animate-spin" />
          <span>Loading clinical summaries...</span>
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={<FileText className="text-slate/40 h-8 w-8" />}
          title="No clinical summaries found"
          description={
            sessions.length === 0
              ? 'No consultation summaries recorded yet. Conduct voice consultations to generate AI clinical notes.'
              : `No summaries matching status "${filterStatus}".`
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {filteredSessions.map((session) => {
            const patient = session.patientId
              ? patientMap.get(session.patientId)
              : null;
            const patientNameParts = patient
              ? [patient.firstName, patient.lastName].filter(Boolean)
              : [];
            const patientName =
              patientNameParts.length > 0
                ? patientNameParts.join(' ').trim()
                : (patient as any)?.name ||
                  patient?.email ||
                  (session.patientId
                    ? `Patient #${session.patientId.slice(-6)}`
                    : 'Patient');
            const formattedDate = session.startedAt
              ? new Date(session.startedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent Session';

            return (
              <Card
                key={session.id}
                className="hover:border-hi-yellow/60 flex flex-col justify-between transition-colors"
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="font-serif text-lg">
                          {patientName}
                        </CardTitle>
                        <p className="text-slate mt-0.5 text-xs">
                          Clinical Consultation
                        </p>
                      </div>
                      <Badge
                        variant={
                          session.status === 'completed'
                            ? 'success'
                            : 'secondary'
                        }
                      >
                        {session.status === 'completed'
                          ? 'Completed'
                          : 'Active'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="text-slate flex items-center gap-1.5 text-xs">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formattedDate}</span>
                    </div>

                    {session.soapNote ? (
                      <div className="space-y-2">
                        {session.soapNote.assessment && (
                          <div>
                            <p className="text-deep-ink mb-1 text-[11px] font-semibold tracking-wider uppercase">
                              Assessment
                            </p>
                            <p className="text-slate line-clamp-2 text-xs leading-relaxed">
                              {session.soapNote.assessment}
                            </p>
                          </div>
                        )}
                        {session.soapNote.plan && (
                          <div>
                            <p className="text-deep-ink mb-1 text-[11px] font-semibold tracking-wider uppercase">
                              Plan
                            </p>
                            <p className="text-slate line-clamp-2 text-xs leading-relaxed">
                              {session.soapNote.plan}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate text-xs italic">
                        {session.transcript
                          ? 'Transcript recorded; SOAP note pending completion.'
                          : 'Session recorded.'}
                      </p>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="pt-2">
                  <Link
                    href={`/dashboard/doctor/summaries/${session.id}`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      className="border-deep-ink/15 text-deep-ink hover:bg-hi-yellow hover:border-hi-yellow group w-full cursor-pointer justify-between rounded-full px-5 font-medium transition-all"
                    >
                      <span>View Summary & Note</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
