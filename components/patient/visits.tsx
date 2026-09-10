'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, Calendar, UserCheck, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Doctor, Session } from '@/lib/db';

interface PatientVisitsProps {
  sessions: Session[];
  doctor: Doctor | null;
}

export function PatientVisits({ sessions, doctor }: PatientVisitsProps) {
  const [visitFilter, setVisitFilter] = useState<'all' | 'completed' | 'active'>('all');

  const filteredSessions = sessions.filter((session) => {
    if (visitFilter === 'completed') return session.status === 'completed';
    if (visitFilter === 'active') return session.status !== 'completed';
    return true;
  });

  return (
    <div className="animate-in fade-in space-y-4 duration-200">
      {/* Screen Header */}
      <div className="border-deep-ink/10 space-y-3 rounded-2xl border bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-deep-ink font-serif text-lg font-bold">Your Consultations</h2>
            <p className="text-slate text-xs">
              Summaries, assessment findings, and treatment plans from your clinical visits.
            </p>
          </div>
          <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold">
            {sessions.length} total
          </Badge>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-soft-meadow/60 border-deep-ink/5 flex gap-1.5 rounded-xl border p-1">
          {(
            [
              { id: 'all', label: 'All Visits' },
              { id: 'completed', label: 'Completed' },
              { id: 'active', label: 'In Progress' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setVisitFilter(tab.id)}
              className={cn(
                'flex-1 cursor-pointer rounded-lg py-1.5 text-center text-xs font-semibold transition-all',
                visitFilter === tab.id
                  ? 'text-deep-ink bg-white shadow-2xs'
                  : 'text-slate hover:text-deep-ink'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Consultations List */}
      {filteredSessions.length === 0 ? (
        <Card className="space-y-3 rounded-2xl border-dashed bg-white p-8 text-center">
          <Clock className="text-slate/30 mx-auto h-10 w-10" />
          <h4 className="text-deep-ink font-serif text-base font-bold">No visits found</h4>
          <p className="text-slate mx-auto max-w-xs text-xs">
            {visitFilter !== 'all'
              ? `You don't have any visits with status "${visitFilter}".`
              : 'You haven’t completed any clinical consultations yet.'}
          </p>
          <div className="pt-2">
            <Link href="/intake">
              <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 rounded-full px-5 text-xs font-semibold shadow-2xs">
                Start Health Intake
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const dateStr = session.startedAt
              ? new Date(session.startedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';
            const summary =
              session.soapNote?.assessment ||
              session.soapNote?.plan ||
              (session.transcript ? `${session.transcript.slice(0, 140)}...` : 'Clinical encounter recorded.');

            return (
              <Card
                key={session.id}
                className="border-deep-ink/10 hover:border-deep-ink/30 space-y-3 rounded-2xl border bg-white p-4 shadow-2xs transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-deep-ink font-serif text-base font-semibold">
                        Consultation {doctor?.name ? `with Dr. ${doctor.name}` : ''}
                      </h4>
                      <Badge
                        variant={session.status === 'completed' ? 'success' : 'default'}
                        className="text-[10px]"
                      >
                        {session.status === 'completed' ? 'Completed' : 'Active'}
                      </Badge>
                    </div>
                    <div className="text-slate mt-1 flex flex-wrap items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="text-slate/60 h-3 w-3" />
                        {dateStr}
                      </span>
                      {doctor?.specialty && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="text-slate/60 h-3 w-3" />
                          {doctor.specialty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-soft-meadow/40 border-deep-ink/5 rounded-xl border p-3">
                  <p className="text-deep-ink/90 line-clamp-3 text-xs leading-relaxed">{summary}</p>
                </div>

                <Link href={`/dashboard/patient/consultations/${session.id}`} className="block">
                  <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 h-9 w-full cursor-pointer gap-1.5 rounded-xl text-xs font-semibold shadow-2xs">
                    <span>View Full Clinical Summary & Care Plan</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
