'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Mic,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getDashboardPath } from '@/lib/auth/roles';

export function LandingHero() {
  const { user, isAuthenticated } = useAuth();
  const dashboardHref = getDashboardPath(user?.userType);
  const roleLabel = user?.userType
    ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1)
    : '';

  return (
    <section className="relative overflow-hidden pt-6 pb-12 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-6">
            <h1 className="text-deep-ink font-serif text-3xl leading-[1.15] font-normal text-balance sm:text-5xl lg:text-6xl">
              Medical memory, powered by AI
            </h1>
            <p className="text-slate text-sm leading-relaxed text-balance sm:text-base">
              Noa transforms your patient consultations into structured clinical
              intelligence in real time. Document patient visits naturally,
              synthesize accurate SOAP notes, and eliminate chart documentation
              debt.
            </p>
            {isAuthenticated && user ? (
              <div className="space-y-4 pt-2">
                <div className="border-deep-ink/10 bg-soft-meadow/70 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs shadow-2xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-deep-ink">
                    Active session:{' '}
                    <strong className="font-semibold">
                      {user.name
                        ? `${user.userType === 'doctor' ? 'Dr. ' : ''}${user.name}`
                        : user.email}
                    </strong>{' '}
                    <Badge
                      variant="secondary"
                      className="ml-1 text-[10px] uppercase"
                    >
                      {roleLabel}
                    </Badge>
                  </span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href={dashboardHref} className="block w-full sm:w-auto">
                    <Button
                      variant="dark"
                      className="bg-deep-ink hover:bg-deep-ink/90 h-11 w-full gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold shadow-2xs sm:w-auto"
                    >
                      <span>Open {roleLabel} Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  {user.userType === 'doctor' ? (
                    <Link
                      href="/dashboard/doctor/sessions/new"
                      className="block w-full sm:w-auto"
                    >
                      <Button
                        variant="outline"
                        className="hover:bg-soft-meadow border-deep-ink/20 h-11 w-full gap-2 rounded-lg px-6 py-2.5 text-sm font-medium sm:w-auto"
                      >
                        <Mic className="text-deep-ink h-4 w-4" />
                        <span>Start Voice Session</span>
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/intake" className="block w-full sm:w-auto">
                      <Button
                        variant="outline"
                        className="hover:bg-soft-meadow border-deep-ink/20 h-11 w-full gap-2 rounded-lg px-6 py-2.5 text-sm font-medium sm:w-auto"
                      >
                        <UserCheck className="text-deep-ink h-4 w-4" />
                        <span>Patient Check-in</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Link
                    href="/auth/signup?type=doctor"
                    className="block w-full sm:w-auto"
                  >
                    <Button
                      variant="dark"
                      className="h-11 w-full gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold shadow-2xs sm:w-auto"
                    >
                      <span>Start for Doctors</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/intake" className="block w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="hover:bg-soft-meadow border-deep-ink/20 h-11 w-full gap-2 rounded-lg px-6 py-2.5 text-sm font-medium sm:w-auto"
                    >
                      <UserCheck className="text-deep-ink h-4 w-4" />
                      <span>Patient Check-in</span>
                    </Button>
                  </Link>
                </div>
                <p className="text-slate/80 text-xs">
                  Are you a patient?{' '}
                  <Link
                    href="/intake"
                    className="text-deep-ink hover:text-deep-ink/80 font-semibold underline underline-offset-4"
                  >
                    Complete your check-in &rarr;
                  </Link>
                </p>
              </>
            )}
          </div>

          {/* Interactive Hero Card Preview */}
          <div className="relative mt-4 lg:mt-0">
            <div className="via-soft-meadow to-deep-ink/5 absolute -inset-3 rounded-3xl bg-gradient-to-br from-emerald-500/10 opacity-60 blur-2xl" />

            <Card className="border-deep-ink/10 relative space-y-4 rounded-3xl border bg-white/95 p-5 font-sans shadow-xl backdrop-blur-md sm:p-6">
              {/* Session Header */}
              <div className="border-deep-ink/8 flex items-center justify-between border-b pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  </span>
                  <span className="text-deep-ink font-serif text-[11px] font-bold tracking-wider uppercase">
                    Live Consultation
                  </span>
                  <span className="text-slate bg-soft-meadow border-deep-ink/5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium">
                    Dr. Rivera
                  </span>
                </div>

                {/* Audio Activity Visualizer + Timer */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-3.5 items-center gap-0.5 px-1"
                    aria-hidden="true"
                  >
                    <span className="h-2 w-0.5 animate-pulse rounded-full bg-emerald-500" />
                    <span className="h-3.5 w-0.5 animate-pulse rounded-full bg-emerald-600 [animation-delay:150ms]" />
                    <span className="h-1.5 w-0.5 animate-pulse rounded-full bg-emerald-500 [animation-delay:300ms]" />
                    <span className="h-3 w-0.5 animate-pulse rounded-full bg-emerald-600 [animation-delay:75ms]" />
                    <span className="h-2 w-0.5 animate-pulse rounded-full bg-emerald-500 [animation-delay:200ms]" />
                  </div>

                  <div className="bg-soft-meadow border-deep-ink/10 text-deep-ink flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>00:24</span>
                  </div>
                </div>
              </div>

              {/* Real-time Dialogue Transcript */}
              <div className="bg-canvas/70 border-deep-ink/6 space-y-2 rounded-2xl border p-2 text-xs">
                {/* Doctor Turn */}
                <div className="border-deep-ink/5 flex items-start gap-2.5 rounded-xl border bg-white p-2.5 shadow-2xs">
                  <div className="bg-deep-ink mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white">
                    DR
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-deep-ink font-serif text-xs font-bold">
                        Dr. Rivera
                      </p>
                      <span className="text-slate/70 font-mono text-[9px]">
                        10:14:02
                      </span>
                    </div>
                    <p className="text-slate font-sans text-[11px] leading-relaxed">
                      How has the adjusted blood pressure dosage been feeling
                      this week?
                    </p>
                  </div>
                </div>

                {/* Patient Turn */}
                <div className="bg-soft-meadow/50 border-deep-ink/5 flex items-start gap-2.5 rounded-xl border p-2.5 shadow-2xs">
                  <div className="bg-soft-meadow text-deep-ink border-deep-ink/20 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold">
                    PT
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-deep-ink font-serif text-xs font-bold">
                        John D.{' '}
                        <span className="text-slate/80 font-sans text-[10px] font-normal">
                          (Patient)
                        </span>
                      </p>
                      <span className="text-slate/70 font-mono text-[9px]">
                        10:14:18
                      </span>
                    </div>
                    <p className="text-slate font-sans text-[11px] leading-relaxed">
                      Much better. Morning readings are around{' '}
                      <span className="text-deep-ink border-deep-ink/5 rounded border bg-white/80 px-1 py-0.5 font-semibold">
                        124/80
                      </span>{' '}
                      and no more lightheadedness.
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto-Generated SOAP Note Card */}
              <div className="border-deep-ink/10 to-soft-meadow/30 overflow-hidden rounded-2xl border bg-gradient-to-b from-white shadow-xs">
                <div className="border-deep-ink/8 flex items-center justify-between border-b bg-white/80 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-lg border border-emerald-200/60 bg-emerald-50">
                      <FileCheck className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-deep-ink font-serif text-xs font-bold">
                      Auto-Generated SOAP Note
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-sans text-[10px] font-medium text-emerald-700">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>Ready</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 p-3.5 text-[11px] sm:grid-cols-2">
                  <div className="border-deep-ink/5 space-y-1 rounded-xl border bg-white/70 p-2.5">
                    <span className="text-deep-ink block font-serif text-xs font-bold">
                      Subjective
                    </span>
                    <p className="text-slate font-sans text-[11px] leading-relaxed">
                      BP well-managed; no lightheadedness since dose adjustment.
                    </p>
                  </div>

                  <div className="border-deep-ink/5 space-y-1 rounded-xl border bg-white/70 p-2.5">
                    <span className="text-deep-ink block font-serif text-xs font-bold">
                      Objective
                    </span>
                    <p className="text-slate font-sans text-[11px] leading-relaxed">
                      BP 124/80 mmHg. Vitals stable. Alert and oriented.
                    </p>
                  </div>

                  <div className="border-deep-ink/5 space-y-1 rounded-xl border bg-white/70 p-2.5">
                    <span className="text-deep-ink block font-serif text-xs font-bold">
                      Assessment
                    </span>
                    <p className="text-slate font-sans text-[11px] leading-relaxed">
                      Hypertension well-controlled on current therapy.
                    </p>
                  </div>

                  <div className="border-deep-ink/5 space-y-1 rounded-xl border bg-white/70 p-2.5">
                    <span className="text-deep-ink block font-serif text-xs font-bold">
                      Plan
                    </span>
                    <p className="text-slate font-sans text-[11px] leading-relaxed">
                      Continue current regimen. Follow-up in 4 weeks.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
