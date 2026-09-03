'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Users,
  X,
} from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      {/* Navigation */}
      <nav className="border-b border-deep-ink/8 bg-canvas/90 backdrop-blur-md sticky top-0 z-30 font-sans">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Noa Logo" className="w-8 h-8 rounded-lg shadow-2xs" />
            <span className="text-xl sm:text-2xl font-bold font-serif text-deep-ink tracking-tight">Noa</span>
            <Badge variant="secondary" className="hidden sm:inline-flex text-[11px] font-sans">
              Clinical Intelligence
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-7">
            <Link href="#features" className="text-sm font-medium text-slate hover:text-deep-ink transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate hover:text-deep-ink transition-colors">
              How It Works
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="rounded-lg text-xs font-medium px-3.5 h-8">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="dark" size="sm" className="rounded-lg text-xs font-medium px-4 h-8 shadow-2xs">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Navigation Toggle & Quick Actions */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/auth/login">
              <Button variant="outline" size="xs" className="rounded-lg text-xs px-2.5 h-7">
                Log In
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg hover:bg-deep-ink/5 transition-colors text-deep-ink cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-deep-ink/8 bg-canvas px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-1">
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-deep-ink hover:bg-soft-meadow transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-deep-ink hover:bg-soft-meadow transition-colors"
              >
                How It Works
              </Link>
            </div>
            <div className="pt-2 border-t border-deep-ink/8 flex flex-col gap-2">
              <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="dark" className="w-full rounded-lg font-medium">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="space-y-6">
              <Badge variant="default" className="px-3 py-1 gap-1.5 inline-flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-deep-ink" />
                <span>Next-Generation Clinical Voice AI</span>
              </Badge>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-normal font-serif leading-[1.15] text-balance text-deep-ink">
                Medical memory, powered by AI
              </h1>
              <p className="text-sm sm:text-base text-slate leading-relaxed text-balance">
                Noa transforms your patient consultations into structured clinical intelligence in real time. Document patient visits naturally, synthesize accurate SOAP notes, and eliminate chart documentation debt.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/auth/signup?type=doctor" className="block w-full sm:w-auto">
                  <Button variant="default" className="w-full sm:w-auto rounded-lg px-6 py-2.5 h-11 text-sm font-semibold shadow-2xs gap-2">
                    <span>Start for Doctors</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/auth/signup?type=patient" className="block w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto rounded-lg px-6 py-2.5 h-11 text-sm font-medium hover:bg-soft-meadow"
                  >
                    Patient Portal
                  </Button>
                </Link>
              </div>
            </div>

            {/* Interactive Hero Card Preview */}
            <div className="relative mt-4 lg:mt-0">
              {/* Background ambient lighting */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-hi-yellow/20 via-soft-meadow to-moss-green/15 blur-2xl opacity-70" />

              <Card className="relative p-5 sm:p-6 space-y-4 border border-deep-ink/10 shadow-xl bg-white/95 backdrop-blur-md rounded-3xl font-sans">
                {/* Session Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-deep-ink/8">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                    </span>
                    <span className="text-[11px] font-bold font-serif text-deep-ink uppercase tracking-wider">
                      Live Consultation
                    </span>
                    <span className="text-[10px] text-slate font-medium px-2.5 py-0.5 rounded-full bg-soft-meadow border border-deep-ink/5">
                      Dr. Rivera
                    </span>
                  </div>

                  {/* Audio Activity Visualizer + Timer */}
                  <div className="flex items-center gap-2.5">
                    {/* Live Waveform Bars */}
                    <div className="flex items-center gap-0.5 h-3.5 px-1" aria-hidden="true">
                      <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="w-0.5 h-3.5 bg-emerald-600 rounded-full animate-pulse [animation-delay:150ms]" />
                      <span className="w-0.5 h-1.5 bg-emerald-500 rounded-full animate-pulse [animation-delay:300ms]" />
                      <span className="w-0.5 h-3 bg-emerald-600 rounded-full animate-pulse [animation-delay:75ms]" />
                      <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-pulse [animation-delay:200ms]" />
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-hi-yellow/20 border border-hi-yellow/40 text-deep-ink font-mono text-[10px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-deep-ink/60" />
                      <span>00:24</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Dialogue Transcript */}
                <div className="space-y-2 rounded-2xl bg-canvas/70 p-2 border border-deep-ink/6 text-xs">
                  {/* Doctor Turn */}
                  <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-deep-ink/5 shadow-2xs">
                    <div className="w-6 h-6 rounded-full bg-deep-ink text-white flex items-center justify-center shrink-0 font-bold text-[9px] mt-0.5">
                      DR
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold font-serif text-deep-ink text-xs">Dr. Rivera</p>
                        <span className="text-[9px] text-slate/70 font-mono">10:14:02</span>
                      </div>
                      <p className="text-slate text-[11px] font-sans leading-relaxed">
                        How has the adjusted blood pressure dosage been feeling this week?
                      </p>
                    </div>
                  </div>

                  {/* Patient Turn */}
                  <div className="flex items-start gap-2.5 bg-soft-meadow/50 p-2.5 rounded-xl border border-deep-ink/5 shadow-2xs">
                    <div className="w-6 h-6 rounded-full bg-hi-yellow text-deep-ink border border-deep-ink/10 flex items-center justify-center shrink-0 font-bold text-[9px] mt-0.5">
                      PT
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold font-serif text-deep-ink text-xs">
                          John D. <span className="font-normal font-sans text-slate/80 text-[10px]">(Patient)</span>
                        </p>
                        <span className="text-[9px] text-slate/70 font-mono">10:14:18</span>
                      </div>
                      <p className="text-slate text-[11px] font-sans leading-relaxed">
                        Much better. Morning readings are around <span className="font-semibold text-deep-ink bg-white/80 px-1 py-0.5 rounded border border-deep-ink/5">124/80</span> and no more lightheadedness.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auto-Generated SOAP Note Card */}
                <div className="rounded-2xl border border-deep-ink/10 bg-gradient-to-b from-white to-soft-meadow/30 overflow-hidden shadow-xs">
                  {/* SOAP Note Header */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-deep-ink/8 bg-white/80">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
                        <FileCheck className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-xs font-bold font-serif text-deep-ink">
                        Auto-Generated SOAP Note
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-medium font-sans">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Ready</span>
                    </div>
                  </div>

                  {/* Structured Clinical Grid */}
                  <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    {/* Subjective */}
                    <div className="space-y-1 p-2.5 rounded-xl bg-white/70 border border-deep-ink/5">
                      <span className="text-xs font-bold font-serif text-deep-ink block">
                        Subjective
                      </span>
                      <p className="text-slate font-sans text-[11px] leading-relaxed">
                        BP well-managed; no lightheadedness since dose adjustment.
                      </p>
                    </div>

                    {/* Objective */}
                    <div className="space-y-1 p-2.5 rounded-xl bg-white/70 border border-deep-ink/5">
                      <span className="text-xs font-bold font-serif text-deep-ink block">
                        Objective
                      </span>
                      <p className="text-slate font-sans text-[11px] leading-relaxed">
                        BP 124/80 mmHg. Vitals stable. Alert and oriented.
                      </p>
                    </div>

                    {/* Assessment */}
                    <div className="space-y-1 p-2.5 rounded-xl bg-white/70 border border-deep-ink/5">
                      <span className="text-xs font-bold font-serif text-deep-ink block">
                        Assessment
                      </span>
                      <p className="text-slate font-sans text-[11px] leading-relaxed">
                        Hypertension well-controlled on current therapy.
                      </p>
                    </div>

                    {/* Plan */}
                    <div className="space-y-1 p-2.5 rounded-xl bg-white/70 border border-deep-ink/5">
                      <span className="text-xs font-bold font-serif text-deep-ink block">
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
      <section id="features" className="bg-soft-meadow/60 py-14 sm:py-20 border-y border-deep-ink/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 space-y-3">
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-deep-ink">
              Clinical intelligence at your voice
            </h2>
            <p className="text-slate text-sm sm:text-base">
              Engineered specifically for medical practitioners and patient outcomes, eliminating documentation overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Mic,
                title: 'Voice-First Consultations',
                description: 'Speak naturally with your patients. Noa ambiently captures every clinical detail without disrupting dialogue.',
              },
              {
                icon: FileText,
                title: 'Instant SOAP Synthesis',
                description: 'Structured Subjective, Objective, Assessment, and Plan notes generated automatically before the visit ends.',
              },
              {
                icon: Brain,
                title: 'Clinical Context Recall',
                description: 'Instant recall of prior consultation notes, patient allergies, and active medication regimens at your fingertips.',
              },
              {
                icon: ShieldCheck,
                title: 'HIPAA-Ready Architecture',
                description: 'Enterprise-grade encryption with rigorous data privacy standards to protect sensitive health records.',
              },
              {
                icon: Users,
                title: 'Patient-Friendly Summaries',
                description: 'Translates complex medical jargon into clear, actionable care plans patients can understand and follow.',
              },
              {
                icon: Layers,
                title: 'Seamless Workflow',
                description: 'Export notes, download PDF reports, and sync consultation summaries with minimal clicks.',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card key={idx} className="p-6 sm:p-8 hover:border-deep-ink/20 transition-colors bg-white shadow-editorial">
                  <div className="w-10 h-10 rounded-xl bg-hi-yellow/20 border border-hi-yellow/40 flex items-center justify-center mb-5 text-deep-ink">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-medium font-serif text-deep-ink mb-2">{feature.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{feature.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
            <h2 className="text-2xl sm:text-4xl font-normal font-serif text-deep-ink">How Noa works</h2>
            <p className="text-slate text-sm sm:text-base">
              Four frictionless steps to eliminate consultation documentation backlogs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                step: '01',
                title: 'Begin Voice Session',
                description: 'Select your patient record and launch the ambient audio stream with one click.',
              },
              {
                step: '02',
                title: 'Ambient Voice AI',
                description: 'Advanced speech recognition transcribes doctor and patient dialogue simultaneously.',
              },
              {
                step: '03',
                title: 'Structured Note Generation',
                description: 'SOAP notes and clinical suggestions synthesize in real time as the consultation proceeds.',
              },
              {
                step: '04',
                title: 'Sign & Share Care Plan',
                description: 'Review the note, sign off, and send an easy-to-read summary to the patient portal.',
              },
            ].map((item, idx) => (
              <Card key={idx} className="p-6 sm:p-7 flex gap-4 sm:gap-5 items-start bg-white shadow-editorial">
                <span className="text-2xl sm:text-3xl font-medium font-serif text-deep-ink/25 shrink-0">
                  {item.step}
                </span>
                <div className="space-y-1 sm:space-y-1.5">
                  <h3 className="text-base sm:text-lg font-medium font-serif text-deep-ink">{item.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-soft-meadow py-16 sm:py-24 border-t border-deep-ink/8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-normal font-serif text-deep-ink">
            Ready to reclaim hours on clinical documentation?
          </h2>
          <p className="text-slate text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join healthcare professionals who have transformed consultation flow with Noa.
          </p>
          <div className="pt-2">
            <Link href="/auth/signup?type=doctor" className="inline-block w-full sm:w-auto">
              <Button variant="default" className="w-full sm:w-auto rounded-lg px-8 py-3 h-12 text-sm font-semibold shadow-2xs">
                Start Your Practice Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dark Footer Band (Deliberate Tonal Break) */}
      <footer className="bg-deep-ink text-white/70 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-hi-yellow">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-medium text-base text-white">Noa</span>
              <span className="text-white/50">— Medical Memory Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-white/60">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Portal Login</Link>
          </div>
          <p className="text-white/40">&copy; 2026 Noa Health. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
