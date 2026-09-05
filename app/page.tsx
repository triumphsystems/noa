'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  FileCheck,
  FileText,
  Layers,
  Lock,
  Menu,
  Mic,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-canvas text-deep-ink min-h-screen">
      {/* Navigation */}
      <nav className="border-deep-ink/8 bg-canvas/90 sticky top-0 z-30 border-b font-sans backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="group flex items-center gap-3.5">
            <img
              src="/logo.svg"
              alt="Noa Logo"
              className="border-deep-ink/15 h-10 w-10 shrink-0 rounded-xl border shadow-2xs transition-transform group-hover:scale-105"
            />
            <span className="text-deep-ink font-serif text-2xl font-bold tracking-tight sm:text-3xl">
              Noa
            </span>
            <Badge
              variant="secondary"
              className="hidden font-sans text-xs sm:inline-flex"
            >
              Clinical Intelligence
            </Badge>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-slate hover:text-deep-ink text-sm font-medium transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-slate hover:text-deep-ink text-sm font-medium transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/intake"
              className="text-deep-ink hover:text-deep-ink/80 bg-soft-meadow border-deep-ink/10 hover:bg-soft-meadow/70 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold transition-colors"
            >
              <UserCheck className="text-deep-ink h-3.5 w-3.5" />
              <span>Patient Check-in</span>
            </Link>
            <div className="flex items-center gap-2.5 pl-2">
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-deep-ink/80 hover:text-deep-ink hover:bg-deep-ink/5 h-9 rounded-lg px-3.5 text-xs font-semibold"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  variant="dark"
                  size="sm"
                  className="bg-deep-ink hover:bg-deep-ink/90 h-9 rounded-lg px-4 text-xs font-semibold text-white shadow-xs transition-all hover:shadow"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Navigation Toggle & Quick Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/auth/login">
              <Button
                variant="outline"
                size="xs"
                className="h-7 rounded-lg px-2.5 text-xs"
              >
                Log In
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="hover:bg-deep-ink/5 text-deep-ink cursor-pointer rounded-lg p-1.5 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-deep-ink/8 bg-canvas space-y-3 border-t px-4 py-4 md:hidden">
            <div className="flex flex-col space-y-1">
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-deep-ink hover:bg-soft-meadow rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-deep-ink hover:bg-soft-meadow rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="/intake"
                onClick={() => setMobileMenuOpen(false)}
                className="text-deep-ink bg-soft-meadow border-deep-ink/10 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
              >
                <UserCheck className="text-deep-ink h-4 w-4" />
                <span>Patient Check-in</span>
              </Link>
            </div>
            <div className="border-deep-ink/8 flex flex-col gap-2 border-t pt-2">
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button
                  variant="dark"
                  className="w-full rounded-lg font-medium"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-12 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-6">
              <h1 className="text-deep-ink font-serif text-3xl leading-[1.15] font-normal text-balance sm:text-5xl lg:text-6xl">
                Medical memory, powered by AI
              </h1>
              <p className="text-slate text-sm leading-relaxed text-balance sm:text-base">
                Noa transforms your patient consultations into structured
                clinical intelligence in real time. Document patient visits
                naturally, synthesize accurate SOAP notes, and eliminate chart
                documentation debt.
              </p>
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
            </div>

            {/* Interactive Hero Card Preview */}
            <div className="relative mt-4 lg:mt-0">
              {/* Background ambient lighting */}
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
                    {/* Live Waveform Bars */}
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
                  {/* SOAP Note Header */}
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

                  {/* Structured Clinical Grid */}
                  <div className="grid grid-cols-1 gap-3 p-3.5 text-[11px] sm:grid-cols-2">
                    {/* Subjective */}
                    <div className="border-deep-ink/5 space-y-1 rounded-xl border bg-white/70 p-2.5">
                      <span className="text-deep-ink block font-serif text-xs font-bold">
                        Subjective
                      </span>
                      <p className="text-slate font-sans text-[11px] leading-relaxed">
                        BP well-managed; no lightheadedness since dose
                        adjustment.
                      </p>
                    </div>

                    {/* Objective */}
                    <div className="border-deep-ink/5 space-y-1 rounded-xl border bg-white/70 p-2.5">
                      <span className="text-deep-ink block font-serif text-xs font-bold">
                        Objective
                      </span>
                      <p className="text-slate font-sans text-[11px] leading-relaxed">
                        BP 124/80 mmHg. Vitals stable. Alert and oriented.
                      </p>
                    </div>

                    {/* Assessment */}
                    <div className="border-deep-ink/5 space-y-1 rounded-xl border bg-white/70 p-2.5">
                      <span className="text-deep-ink block font-serif text-xs font-bold">
                        Assessment
                      </span>
                      <p className="text-slate font-sans text-[11px] leading-relaxed">
                        Hypertension well-controlled on current therapy.
                      </p>
                    </div>

                    {/* Plan */}
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

      {/* Features Section */}
      <section
        id="features"
        className="bg-soft-meadow/50 border-deep-ink/8 scroll-mt-20 border-y py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-14 max-w-2xl space-y-3.5 text-center sm:mb-18">
            <div className="border-deep-ink/8 text-deep-ink/75 inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold shadow-2xs">
              <Sparkles className="text-deep-ink h-3.5 w-3.5" />
              <span>Core Clinical Capabilities</span>
            </div>
            <h2 className="text-deep-ink font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Ambient intelligence at the speed of speech
            </h2>
            <p className="text-slate text-sm leading-relaxed sm:text-base">
              Engineered specifically for practicing clinicians. Eliminate
              documentation backlog and focus entirely on patient care.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Mic,
                badge: 'Ambient Audio',
                title: 'Voice-First Consultations',
                description:
                  'Speak naturally with your patients. Noa ambiently captures dialogue, filtering background room noise and clinical interruptions.',
                metric: 'Continuous streaming',
              },
              {
                icon: FileText,
                badge: 'Documentation',
                title: 'Instant SOAP Synthesis',
                description:
                  'Generates structured Subjective, Objective, Assessment, and Plan notes automatically before the consultation ends.',
                metric: 'Multi-format export',
              },
              {
                icon: Brain,
                badge: 'Clinical Memory',
                title: 'Clinical Context Recall',
                description:
                  'Instant recall of prior consultation notes, patient allergies, and active medication regimens at your fingertips.',
                metric: 'Sub-second search',
              },
              {
                icon: ShieldCheck,
                badge: 'Security',
                title: 'HIPAA-Ready Architecture',
                description:
                  'Enterprise-grade encryption with rigorous data privacy standards to protect sensitive electronic health records.',
                metric: 'AES-256 & TLS 1.3',
              },
              {
                icon: Users,
                badge: 'Patient Care',
                title: 'Patient-Friendly Summaries',
                description:
                  'Translates complex medical jargon into clear, actionable care plans patients can easily understand and follow.',
                metric: 'Plain-language AI',
              },
              {
                icon: Layers,
                badge: 'Workflow',
                title: 'Seamless EHR Workflow',
                description:
                  'Export notes, download PDF reports, and sync consultation summaries to clinical workflows with minimal clicks.',
                metric: 'PDF & clipboard sync',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group border-deep-ink/8 hover:border-deep-ink/25 relative flex flex-col justify-between rounded-2xl border bg-white p-7 shadow-xs transition-all duration-200 hover:bg-white hover:shadow-md sm:p-8"
                >
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <div className="bg-soft-meadow border-deep-ink/10 text-deep-ink group-hover:bg-deep-ink flex h-12 w-12 items-center justify-center rounded-xl border shadow-2xs transition-all duration-200 group-hover:scale-105 group-hover:text-white">
                        <Icon className="h-5 w-5 transition-colors" />
                      </div>
                      <span className="text-deep-ink/75 bg-soft-meadow border-deep-ink/8 rounded-full border px-2.5 py-0.5 font-sans text-[11px] font-semibold tracking-wider uppercase">
                        {feature.badge}
                      </span>
                    </div>

                    <h3 className="text-deep-ink mb-2.5 font-serif text-lg font-bold tracking-tight sm:text-xl">
                      {feature.title}
                    </h3>
                    <p className="text-slate font-sans text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="border-deep-ink/5 text-slate/80 mt-6 flex items-center justify-between border-t pt-5 font-sans text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full border border-emerald-600/30 bg-emerald-500/80" />
                      {feature.metric}
                    </span>
                    <ArrowRight className="text-slate/40 group-hover:text-deep-ink h-3.5 w-3.5 transition-all group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="scroll-mt-24 pt-28 pb-24 sm:pt-36 sm:pb-32"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center sm:mb-20">
            <h2 className="text-deep-ink font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              How Noa works
            </h2>
            <p className="text-slate text-sm leading-relaxed sm:text-base">
              Four frictionless steps to eliminate consultation documentation
              backlogs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7">
            {[
              {
                step: '01',
                title: 'Begin Voice Session',
                description:
                  'Select your patient record and launch the ambient audio stream with one click.',
              },
              {
                step: '02',
                title: 'Ambient Voice AI',
                description:
                  'Advanced speech recognition transcribes doctor and patient dialogue simultaneously.',
              },
              {
                step: '03',
                title: 'Structured Note Generation',
                description:
                  'SOAP notes and clinical suggestions synthesize in real time as the consultation proceeds.',
              },
              {
                step: '04',
                title: 'Sign & Share Care Plan',
                description:
                  'Review the note, sign off, and send an easy-to-read summary to the patient portal.',
              },
            ].map((item, idx) => (
              <Card
                key={idx}
                className="shadow-editorial border-deep-ink/8 hover:border-deep-ink/25 flex items-start gap-5 rounded-2xl border bg-white p-7 transition-all sm:gap-6 sm:p-9"
              >
                <span className="text-deep-ink/25 shrink-0 pt-0.5 font-serif text-3xl font-semibold sm:text-4xl">
                  {item.step}
                </span>
                <div className="space-y-2">
                  <h3 className="text-deep-ink font-serif text-lg font-semibold tracking-tight sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="text-slate text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-soft-meadow border-deep-ink/8 border-t py-20 sm:py-28">
        <div className="mx-auto max-w-2xl space-y-4 px-4 text-center sm:px-6">
          <h2 className="text-deep-ink font-serif text-2xl leading-snug font-medium tracking-tight sm:text-3xl">
            Ready to reclaim hours on clinical documentation?
          </h2>
          <p className="text-slate mx-auto max-w-lg text-sm leading-relaxed sm:text-base">
            Join healthcare professionals who have transformed consultation flow
            with Noa.
          </p>
          <div className="pt-3">
            <Link
              href="/auth/signup?type=doctor"
              className="inline-block w-full sm:w-auto"
            >
              <Button
                variant="dark"
                className="h-12 w-full rounded-lg px-8 py-3 text-sm font-semibold shadow-2xs sm:w-auto"
              >
                Start Your Practice Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dark Footer Band (Deliberate Tonal Break) */}
      <footer className="bg-deep-ink py-12 text-white/70 sm:py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-xs sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-base font-medium text-white">
                Noa
              </span>
              <span className="text-white/50">— Medical Memory Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-white/60">
            <Link
              href="#features"
              className="transition-colors hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="transition-colors hover:text-white"
            >
              How It Works
            </Link>
            <Link href="/intake" className="transition-colors hover:text-white">
              Patient Check-in
            </Link>
            <Link
              href="/auth/login"
              className="transition-colors hover:text-white"
            >
              Portal Login
            </Link>
          </div>
          <p className="text-white/40">
            &copy; 2026 Noa Health. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
