'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { Patient, Session } from '@/lib/db';

interface DoctorRecentSessionsProps {
  sessions: Session[];
  patients: Patient[];
  isLoading: boolean;
}

export function DoctorRecentSessions({
  sessions,
  patients,
  isLoading,
}: DoctorRecentSessionsProps) {
  const getPatientName = (patientId: string) => {
    const patient = patients.find((entry) => entry.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const formatSessionTime = (startedAt: number) => {
    const date = new Date(startedAt);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-deep-ink font-serif text-lg font-medium">
          Recent Sessions
        </h3>
        {sessions.length > 0 && (
          <Link
            href="/dashboard/doctor/sessions/new"
            className="text-slate hover:text-deep-ink text-xs font-medium"
          >
            View all sessions →
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="text-slate py-12 text-center text-xs">
          Loading sessions...
        </div>
      ) : recentSessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Start your first AI-assisted clinical consultation to see transcripts and SOAP notes here."
          action={
            <Link href="/dashboard/doctor/sessions/new">
              <Button size="sm" className="gap-2 rounded-lg text-xs font-semibold">
                <Plus className="h-4 w-4" />
                Start New Session
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {recentSessions.map((session) => (
            <Card
              key={session.id}
              className="hover:border-hi-yellow/60 p-4 transition-colors sm:p-6"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h4 className="text-deep-ink font-serif text-base font-semibold">
                      {getPatientName(session.patientId)}
                    </h4>
                    <Badge
                      variant={
                        session.status === 'completed'
                          ? 'success'
                          : session.status === 'active'
                            ? 'default'
                            : 'draft'
                      }
                    >
                      {session.status === 'completed'
                        ? 'Completed'
                        : session.status === 'active'
                          ? 'In Progress'
                          : 'Archived'}
                    </Badge>
                  </div>
                  <p className="text-slate line-clamp-1 text-sm">
                    {session.soapNote?.assessment || 'No clinical assessment yet'}
                  </p>
                  <div className="text-slate flex items-center gap-2 pt-1 text-xs">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatSessionTime(session.startedAt)}</span>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <Link
                    href={`/dashboard/doctor/sessions/${session.id}`}
                    className="block sm:inline"
                  >
                    <Button
                      size="sm"
                      variant={session.status === 'completed' ? 'secondary' : 'default'}
                      className="w-full rounded-full font-medium sm:w-auto"
                    >
                      {session.status === 'completed' ? 'View Note' : 'Continue Session'}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
