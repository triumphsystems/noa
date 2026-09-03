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
      <nav className="border-b border-deep-ink/10 bg-soft-meadow/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-serif text-deep-ink tracking-tight">Noa</span>
            <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
              Clinical Intelligence
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-slate hover:text-deep-ink transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate hover:text-deep-ink transition-colors">
              How It Works
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="outline" className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow font-medium">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Navigation Toggle & Quick Actions */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="rounded-full border-deep-ink/20 text-deep-ink text-xs px-3 py-1.5 h-8">
                Log In
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full hover:bg-deep-ink/10 transition-colors text-deep-ink"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-deep-ink/10 bg-soft-meadow px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-2">
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-deep-ink hover:bg-deep-ink/5"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-deep-ink hover:bg-deep-ink/5"
              >
                How It Works
              </Link>
            </div>
            <div className="pt-2 border-t border-deep-ink/10 flex flex-col gap-2">
              <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-5 sm:space-y-6">
              <Badge variant="secondary" className="px-3.5 py-1 text-xs gap-1.5 inline-flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-deep-ink" />
                <span>Next-Generation Voice AI for Healthcare</span>
              </Badge>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif leading-tight text-balance text-deep-ink">
                Medical memory, powered by AI
              </h1>
              <p className="text-sm sm:text-lg text-slate leading-relaxed text-balance">
                Noa transforms your voice consultations into structured clinical intelligence in real time. Document patient visits naturally, synthesize accurate SOAP notes, and never lose clinical context.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <Link href="/auth/signup?type=doctor" className="block w-full sm:w-auto">
                  <Button className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-6 sm:px-8 py-5 sm:py-6 text-base font-semibold shadow-xs gap-2">
                    <span>Start for Doctors</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/auth/signup?type=patient" className="block w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow px-6 sm:px-8 py-5 sm:py-6 text-base font-medium"
                  >
                    Patient Portal
                  </Button>
                </Link>
              </div>
            </div>

            {/* Interactive Hero Card Preview */}
            <div className="relative mt-4 lg:mt-0">
              {/* Glow layers */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-moss-green/40 via-hi-yellow/25 to-fuchsia/20 blur-2xl opacity-60" />
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-hi-yellow/20 via-transparent to-moss-green/10 blur-md opacity-80" />

              <Card className="relative p-5 sm:p-6 space-y-3.5 border border-deep-ink/8 shadow-2xl bg-white/95 backdrop-blur-sm">

                {/* Session header */}
                <div className="flex items-center justify-between pb-3 border-b border-deep-ink/8">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moss-green opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-moss-green" />
                    </span>
                    <span className="text-[11px] font-bold text-deep-ink uppercase tracking-widest">
                      Live Consultation
                    </span>
                    <span className="text-[10px] text-slate font-medium">· Dr. Rivera</span>
                  </div>
                  <Badge variant="default" className="text-[10px] font-mono px-2.5 py-0.5 bg-hi-yellow text-deep-ink">
                    00:24
                  </Badge>
                </div>

                {/* Transcript */}
                <div className="space-y-2.5 rounded-2xl border border-deep-ink/5 overflow-hidden text-xs">
                  {/* Doctor turn */}
                  <div className="flex gap-2.5 bg-soft-meadow/60 px-3.5 py-3">
                    <div className="w-5 h-5 rounded-full bg-deep-ink/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-deep-ink">DR</span>
                    </div>
                    <div>
                      <p className="font-semibold text-deep-ink text-[11px] mb-0.5">Dr. Rivera</p>
                      <p className="text-slate leading-relaxed">How has the adjusted blood pressure dosage been feeling this week?</p>
                    </div>
                  </div>
                  {/* Patient turn */}
                  <div className="flex gap-2.5 bg-white px-3.5 py-3">
                    <div className="w-5 h-5 rounded-full bg-moss-green/25 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-deep-ink">PT</span>
                    </div>
                    <div>
                      <p className="font-semibold text-deep-ink text-[11px] mb-0.5">John D. <span className="font-normal text-slate">(Patient)</span></p>
                      <p className="text-slate leading-relaxed">Much better. Morning readings are around 124/80 and no more lightheadedness.</p>
                    </div>
                  </div>
                </div>

                {/* SOAP note preview */}
                <div className="bg-soft-meadow/50 rounded-2xl border border-deep-ink/8 overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-deep-ink/6 bg-white/60">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-deep-ink flex items-center gap-1.5">
                      <FileCheck className="w-3 h-3 text-moss-green" />
                      Auto-Generated SOAP Note
                    </span>
                    <Badge variant="success" className="text-[9px] px-2 py-0.5">
                      Ready
                    </Badge>
                  </div>
                  <div className="px-3.5 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate font-semibold mb-0.5">Subjective</p>
                      <p className="text-deep-ink leading-relaxed">BP well-managed; no lightheadedness since dose adjustment.</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate font-semibold mb-0.5">Objective</p>
                      <p className="text-deep-ink leading-relaxed">BP 124/80 mmHg. Vitals stable. Alert and oriented.</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate font-semibold mb-0.5">Assessment</p>
                      <p className="text-deep-ink leading-relaxed">Hypertension well-controlled on current therapy.</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate font-semibold mb-0.5">Plan</p>
                      <p className="text-deep-ink leading-relaxed">Continue current regimen. Follow-up in 4 weeks.</p>
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
                <Card key={idx} className="p-6 sm:p-8 hover:border-hi-yellow/60 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-hi-yellow/40 border border-hi-yellow flex items-center justify-center mb-5 text-deep-ink">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold font-serif text-deep-ink mb-2">{feature.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{feature.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 space-y-3">
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-deep-ink">How Noa works</h2>
            <p className="text-slate text-sm sm:text-base">
              Four frictionless steps to eliminate consultation documentation backlogs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
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
              <Card key={idx} className="p-5 sm:p-8 flex gap-4 sm:gap-6 items-start">
                <span className="text-2xl sm:text-3xl font-bold font-serif text-deep-ink/20 shrink-0">
                  {item.step}
                </span>
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-lg sm:text-xl font-semibold font-serif text-deep-ink">{item.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-soft-meadow/80 py-14 sm:py-20 border-t border-deep-ink/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-5 sm:space-y-6">
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-deep-ink">
            Ready to reclaim hours on clinical documentation?
          </h2>
          <p className="text-slate text-sm sm:text-base max-w-xl mx-auto">
            Join medical professionals who have transformed consultation flow with Noa.
          </p>
          <div className="pt-2">
            <Link href="/auth/signup?type=doctor" className="inline-block w-full sm:w-auto">
              <Button className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8 py-5 sm:py-6 text-base font-semibold shadow-xs">
                Start Your Practice Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-deep-ink/10 bg-canvas py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-deep-ink">Noa</span>
            <span>— Medical Memory Platform</span>
          </div>
          <p>&copy; 2026 Noa Health. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
