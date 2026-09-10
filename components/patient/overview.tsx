'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Activity,
  Clock,
  ChevronRight,
  Stethoscope,
  ShieldCheck,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WelcomeBanner } from './welcome-banner';
import type {
  PatientProfile,
  PatientDashboardPayload,
} from '@/lib/types/patient.types';
import type { Doctor, PatientIntake, Session } from '@/lib/db';
import type { PatientScreenTab } from './types';

interface PatientOverviewProps {
  fullName: string;
  hasDoctor: boolean;
  doctor: Doctor | null;
  pendingDoctor: Doctor | null;
  isPendingApproval: boolean;
  sessions: Session[];
  intake: PatientIntake | null;
  patient: PatientProfile | null;
  stats: PatientDashboardPayload['stats'] | null;
  onNavigateTab: (tab: PatientScreenTab) => void;
}

export function PatientOverview({
  fullName,
  hasDoctor,
  doctor,
  pendingDoctor,
  isPendingApproval,
  sessions,
  intake,
  patient,
  stats,
  onNavigateTab,
}: PatientOverviewProps) {
  const recent = sessions[0];
  const dateStr = recent?.startedAt
    ? new Date(recent.startedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';
  const summarySnippet =
    recent?.soapNote?.assessment ||
    recent?.soapNote?.plan ||
    recent?.transcript?.slice(0, 120) ||
    'Clinical consultation recorded.';

  return (
    <div className="animate-in fade-in space-y-5 duration-200">
      {/* Pending Doctor Invitation Card - Priority Banner */}
      {isPendingApproval && pendingDoctor && (
        <div className="space-y-3 rounded-2xl border border-amber-300/80 bg-amber-50/90 p-4 shadow-xs sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-wider text-amber-900 uppercase">
                  Doctor Invitation
                </span>
                <span className="h-2 w-2 animate-ping rounded-full bg-amber-500" />
              </div>
              <h4 className="text-deep-ink mt-0.5 text-sm font-bold sm:text-base">
                Dr. {pendingDoctor.name} invited you to connect
              </h4>
              <p className="text-slate mt-0.5 text-xs leading-relaxed">
                Accept to share your AI intake summaries and consultation notes
                with your clinician.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 sm:max-w-xs">
            <Button
              size="sm"
              onClick={() => onNavigateTab('care-team')}
              className="bg-deep-ink hover:bg-deep-ink/90 h-8 flex-1 cursor-pointer rounded-xl text-xs font-semibold text-white shadow-xs"
            >
              Review Invitation
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('care-team')}
              className="text-slate hover:text-deep-ink h-8 cursor-pointer rounded-xl border-amber-300 text-xs"
            >
              View Details
            </Button>
          </div>
        </div>
      )}

      {/* Welcome Banner Card */}
      <WelcomeBanner
        name={fullName}
        hasDoctor={hasDoctor}
        doctorName={doctor?.name}
      />

      {/* Desktop 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {/* Left Column (2 cols): Metrics & Consultation History */}
        <div className="space-y-5 lg:col-span-2">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
            <button
              onClick={() => onNavigateTab('visits')}
              className="border-deep-ink/10 hover:border-deep-ink/30 group cursor-pointer rounded-2xl border bg-white p-3.5 text-left shadow-2xs transition-all sm:p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate text-[10px] font-bold tracking-wider uppercase sm:text-xs">
                  Visits
                </span>
                <CalendarDays className="text-slate group-hover:text-deep-ink h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4" />
              </div>
              <div className="text-deep-ink mt-1.5 font-serif text-2xl font-bold sm:text-3xl">
                {stats?.totalConsultations ?? sessions.length}
              </div>
              <span className="text-slate block truncate text-[10px] sm:text-xs">
                Recorded visits
              </span>
            </button>

            <button
              onClick={() => onNavigateTab('visits')}
              className="border-deep-ink/10 hover:border-deep-ink/30 group cursor-pointer rounded-2xl border bg-white p-3.5 text-left shadow-2xs transition-all sm:p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate text-[10px] font-bold tracking-wider uppercase sm:text-xs">
                  Status
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 sm:h-4 sm:w-4" />
              </div>
              <div className="mt-1.5 font-serif text-2xl font-bold text-emerald-700 sm:text-3xl">
                {stats?.completedConsultations ??
                  sessions.filter((s) => s.status === 'completed').length}
              </div>
              <span className="text-slate block truncate text-[10px] sm:text-xs">
                Completed visits
              </span>
            </button>

            <button
              onClick={() => onNavigateTab('records')}
              className="border-deep-ink/10 hover:border-deep-ink/30 group cursor-pointer rounded-2xl border bg-white p-3.5 text-left shadow-2xs transition-all sm:p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate text-[10px] font-bold tracking-wider uppercase sm:text-xs">
                  Intake
                </span>
                <Activity className="text-slate group-hover:text-deep-ink h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4" />
              </div>
              <div className="text-deep-ink mt-2 truncate font-serif text-base font-bold sm:text-lg">
                {stats?.hasIntake || intake ? 'Active' : 'Pending'}
              </div>
              <span className="text-slate block truncate text-[10px] sm:text-xs">
                Health profile
              </span>
            </button>
          </div>

          {/* Recent Visit Preview */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-deep-ink font-serif text-sm font-bold sm:text-base">
                Recent Visit Summary
              </h3>
              {sessions.length > 0 && (
                <button
                  onClick={() => onNavigateTab('visits')}
                  className="text-slate hover:text-deep-ink flex cursor-pointer items-center gap-0.5 text-xs font-semibold"
                >
                  <span>View all ({sessions.length})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <Card className="rounded-2xl border-dashed bg-white/70 p-6 text-center sm:p-8">
                <Clock className="text-slate/40 mx-auto mb-2 h-8 w-8" />
                <p className="text-slate text-xs font-medium">
                  No consultation visits recorded yet.
                </p>
                <p className="text-slate/70 mt-1 mb-3 text-[11px]">
                  Your summaries and AI care plans will appear here after
                  consultations.
                </p>
                <Link href="/intake">
                  <Button
                    variant="outline"
                    className="h-8 cursor-pointer rounded-full px-4 text-xs font-semibold"
                  >
                    Start First Intake
                  </Button>
                </Link>
              </Card>
            ) : (
              <Card className="border-deep-ink/10 space-y-3 rounded-2xl border bg-white p-4 shadow-2xs sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-slate flex items-center gap-1 text-[11px] font-semibold">
                      <Calendar className="text-slate/60 h-3 w-3" />
                      {dateStr}
                    </span>
                    <h4 className="text-deep-ink mt-0.5 font-serif text-base font-bold">
                      Consultation Summary
                    </h4>
                  </div>
                  <Badge
                    variant={
                      recent?.status === 'completed' ? 'success' : 'default'
                    }
                    className="text-[10px]"
                  >
                    {recent?.status === 'completed' ? 'Completed' : 'Active'}
                  </Badge>
                </div>

                <p className="text-slate bg-soft-meadow/40 border-deep-ink/5 line-clamp-2 rounded-xl border p-3 text-xs leading-relaxed sm:text-sm">
                  {summarySnippet}
                </p>

                <Link
                  href={`/dashboard/patient/consultations/${recent?.id}`}
                  className="block"
                >
                  <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 h-9 w-full cursor-pointer gap-1.5 rounded-xl text-xs font-semibold shadow-2xs">
                    <span>View Full Clinical Report</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Care Team & Records Snapshot */}
        <div className="space-y-5">
          {/* Care Team Glance Card */}
          <div className="border-deep-ink/10 space-y-3 rounded-2xl border bg-white p-4 shadow-2xs sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="text-deep-ink h-4 w-4" />
                <h3 className="text-deep-ink font-serif text-sm font-bold">
                  Your Physician
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('care-team')}
                className="text-slate hover:text-deep-ink flex cursor-pointer items-center gap-0.5 text-xs font-semibold"
              >
                <span>Manage</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {hasDoctor ? (
              <div className="bg-soft-meadow/50 border-deep-ink/5 flex items-center justify-between rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="text-deep-ink truncate text-sm font-bold">
                    Dr. {doctor?.name}
                  </p>
                  <p className="text-slate truncate text-xs">
                    {doctor?.specialty || 'General Practice'} •{' '}
                    {doctor?.clinic || 'Clinical Center'}
                  </p>
                </div>
                <Badge variant="success" className="shrink-0 text-[10px]">
                  Linked
                </Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3">
                <div>
                  <p className="text-xs font-semibold text-amber-900">
                    No Doctor Linked
                  </p>
                  <p className="text-slate text-[11px]">
                    Connect with your physician using their Care Code.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onNavigateTab('care-team')}
                  className="bg-deep-ink text-canvas hover:bg-deep-ink/90 h-7 shrink-0 cursor-pointer rounded-xl px-3 text-xs"
                >
                  Connect
                </Button>
              </div>
            )}
          </div>

          {/* Quick Link to Records Snapshot */}
          <div
            onClick={() => onNavigateTab('records')}
            role="button"
            tabIndex={0}
            className="border-deep-ink/10 hover:border-deep-ink/30 flex cursor-pointer items-center justify-between rounded-2xl border bg-white p-4 shadow-2xs transition-all sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="bg-soft-meadow text-deep-ink flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-deep-ink text-xs font-bold">
                  Medical Information & Medications
                </h4>
                <p className="text-slate mt-0.5 text-[11px]">
                  {intake?.medications?.length ||
                    patient?.medications?.length ||
                    0}{' '}
                  meds •{' '}
                  {intake?.allergies?.length || patient?.allergies?.length || 0}{' '}
                  allergies documented
                </p>
              </div>
            </div>
            <ChevronRight className="text-slate h-4 w-4 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
