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
  Mic,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      {/* Navigation */}
      <nav className="border-b border-deep-ink/10 bg-soft-meadow/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-serif text-deep-ink tracking-tight">Noa</span>
            <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
              Clinical Intelligence
            </Badge>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-slate hover:text-deep-ink transition-colors hidden md:block">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate hover:text-deep-ink transition-colors hidden md:block">
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="px-3.5 py-1 text-xs gap-1.5 inline-flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-deep-ink" />
                <span>Next-Generation Voice AI for Healthcare</span>
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif leading-tight text-balance text-deep-ink">
                Medical memory, powered by AI
              </h1>
              <p className="text-base sm:text-lg text-slate leading-relaxed text-balance">
                Noa transforms your voice consultations into structured clinical intelligence in real time. Document patient visits naturally, synthesize accurate SOAP notes, and never lose clinical context.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/auth/signup?type=doctor" className="block sm:inline-block">
                  <Button className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8 py-6 text-base font-semibold shadow-xs gap-2">
                    <span>Start for Doctors</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/auth/signup?type=patient" className="block sm:inline-block">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow px-8 py-6 text-base font-medium"
                  >
                    Patient Portal
                  </Button>
                </Link>
              </div>
            </div>

            {/* Interactive Hero Card Preview */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-moss-green/30 via-hi-yellow/30 to-fuchsia/20 blur-lg opacity-70" />
              <Card className="relative p-6 space-y-4 border border-deep-ink/10 shadow-lg">
                <div className="flex items-center justify-between border-b border-deep-ink/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-moss-green animate-pulse" />
                    <span className="text-xs font-semibold text-deep-ink uppercase tracking-wider">
                      Live Consultation Session
                    </span>
                  </div>
                  <Badge variant="default" className="text-[10px] font-mono">
                    00:24
                  </Badge>
                </div>

                {/* Simulated live transcript */}
                <div className="space-y-3 bg-soft-meadow/40 p-4 rounded-2xl border border-deep-ink/5 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-deep-ink">Dr. Rivera:</span>
                    <p className="text-slate">How has the adjusted blood pressure dosage been feeling this week?</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-deep-ink">Patient (John D.):</span>
                    <p className="text-slate">Much better. Morning readings are around 124/80 and no more lightheadedness.</p>
                  </div>
                </div>

                {/* Real-time SOAP synthesis preview */}
                <div className="bg-white p-4 rounded-2xl border border-deep-ink/10 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-deep-ink flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-moss-green" />
                      Auto-Generated SOAP Note
                    </span>
                    <Badge variant="success" className="text-[10px]">
                      Ready
                    </Badge>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">
                    <strong className="text-deep-ink">Assessment:</strong> Hypertension well-controlled on current therapy. Patient reports complete resolution of lightheadedness.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-soft-meadow/60 py-20 border-y border-deep-ink/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-deep-ink">
              Clinical intelligence at your voice
            </h2>
            <p className="text-slate text-sm sm:text-base">
              Engineered specifically for medical practitioners and patient outcomes, eliminating documentation overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <Card key={idx} className="p-8 hover:border-hi-yellow/60 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-hi-yellow/40 border border-hi-yellow flex items-center justify-center mb-5 text-deep-ink">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold font-serif text-deep-ink mb-2">{feature.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{feature.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-deep-ink">How Noa works</h2>
            <p className="text-slate text-sm sm:text-base">
              Four frictionless steps to eliminate consultation documentation backlogs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
              <Card key={idx} className="p-8 flex gap-6 items-start">
                <span className="text-3xl font-bold font-serif text-deep-ink/20 shrink-0">
                  {item.step}
                </span>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold font-serif text-deep-ink">{item.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-soft-meadow/80 py-20 border-t border-deep-ink/10">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-deep-ink">
            Ready to reclaim hours on clinical documentation?
          </h2>
          <p className="text-slate text-base max-w-xl mx-auto">
            Join medical professionals who have transformed consultation flow with Noa.
          </p>
          <div className="pt-2">
            <Link href="/auth/signup?type=doctor">
              <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8 py-6 text-base font-semibold shadow-xs">
                Start Your Practice Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-deep-ink/10 bg-canvas py-12">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate">
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
