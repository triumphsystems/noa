import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      {/* Navigation */}
      <nav className="border-b border-deep-ink/10 bg-soft-meadow/30">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Zap className="h-7 w-7 text-hi-yellow group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold font-serif">Noa</span>
          </Link>
          <div className="flex items-center gap-12">
            <Link href="#features" className="text-sm font-medium text-slate hover:text-deep-ink transition-colors duration-200">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate hover:text-deep-ink transition-colors duration-200">
              How It Works
            </Link>
            <div className="flex gap-3">
              <Link href="/auth/login">
                <Button variant="outline" className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-canvas hover:border-deep-ink/40 transition-all duration-200">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/signup?type=doctor">
                <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-hi-yellow/10 border border-hi-yellow/30 rounded-full">
                  <span className="inline-flex h-2 w-2 rounded-full bg-hi-yellow animate-pulse" />
                  <span className="text-xs font-semibold text-deep-ink uppercase tracking-widest">Voice-first AI</span>
                </div>
                <h1 className="text-6xl lg:text-7xl font-bold font-serif leading-tight text-balance">
                  Medical memory, powered by AI
                </h1>
              </div>
              <p className="text-lg text-slate leading-8 max-w-lg">
                Noa transforms your voice into structured clinical intelligence. Document consultations naturally, get instant SOAP notes, and never lose patient context.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth/signup?type=doctor" className="group">
                  <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8 py-3.5 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group-hover:translate-y-[-2px]">
                    Start for Doctors
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/auth/signup?type=patient">
                  <Button
                    variant="outline"
                    className="rounded-full border-deep-ink/30 text-deep-ink hover:bg-canvas hover:border-deep-ink/50 px-8 py-3.5 text-base font-semibold transition-all duration-200"
                  >
                    For Patients
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Card with Decorative Elements */}
            <div className="relative h-96">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-moss-green/20 via-fuchsia/10 to-hi-yellow/10 blur-2xl" />
              <div className="relative rounded-[32px] bg-white border border-deep-ink/5 shadow-lg p-8 h-full flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-hi-yellow/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="space-y-4 relative z-10">
                  <div className="h-3 bg-soft-meadow rounded-full w-full animate-pulse" />
                  <div className="h-3 bg-soft-meadow rounded-full w-5/6 animate-pulse delay-100" />
                  <div className="space-y-2 pt-4">
                    <div className="h-2 bg-hi-yellow rounded-full w-2/3 animate-pulse delay-200" />
                    <div className="h-2 bg-slate/20 rounded-full w-full animate-pulse delay-300" />
                    <div className="h-2 bg-slate/20 rounded-full w-4/5 animate-pulse delay-500" />
                  </div>
                </div>
                <div className="relative z-10 flex items-center justify-between pt-8 border-t border-deep-ink/5">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-slate font-semibold">Live processing</p>
                    <p className="text-sm font-medium text-deep-ink">SOAP notes generating</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 w-2 bg-moss-green rounded-full animate-pulse" />
                    <div className="h-2 w-2 bg-hi-yellow rounded-full animate-pulse delay-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-soft-meadow/40 py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl lg:text-6xl font-bold font-serif mb-6">
              Clinical intelligence at your voice
            </h2>
            <p className="text-xl text-slate max-w-2xl mx-auto">
              Everything doctors need to document faster, better, and smarter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🎤',
                title: 'Voice First',
                description: 'Speak naturally during consultations. AI captures every detail automatically.',
              },
              {
                icon: '⚡',
                title: 'Instant Notes',
                description: 'SOAP notes generated in real-time as you talk with patients.',
              },
              {
                icon: '📋',
                title: 'Patient Context',
                description: 'Complete patient history and previous sessions at your fingertips.',
              },
              {
                icon: '🧠',
                title: 'Clinical Intelligence',
                description: 'AI-powered insights and summaries from clinical conversations.',
              },
              {
                icon: '🔒',
                title: 'Secure & Compliant',
                description: 'Enterprise-grade encryption and full HIPAA compliance.',
              },
              {
                icon: '🔗',
                title: 'Seamless Integration',
                description: 'Works with your existing EHR and clinical workflows.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="group bg-white rounded-2xl p-8 border border-deep-ink/5 hover:border-hi-yellow/30 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">{feature.title}</h3>
                <p className="text-slate leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl lg:text-6xl font-bold font-serif mb-6">How Noa works</h2>
            <p className="text-xl text-slate max-w-2xl mx-auto">
              Four simple steps from consultation to documented care
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: '01',
                icon: '▶️',
                title: 'Start a Session',
                description: 'Open a voice session and begin consulting with your patient naturally. No typing required.',
              },
              {
                step: '02',
                icon: '👂',
                title: 'AI Listens',
                description: 'Nova AI transcribes and understands clinical context in real-time, capturing every nuance.',
              },
              {
                step: '03',
                icon: '✍️',
                title: 'Structured Notes',
                description: 'SOAP notes are automatically generated and ready for signing off. No reformatting needed.',
              },
              {
                step: '04',
                icon: '📧',
                title: 'Patient Summary',
                description: 'Patients receive consultation summaries and next steps automatically via secure portal.',
              },
            ].map((item, idx) => (
              <div key={idx} className="group flex gap-8 lg:gap-12 items-start pb-8 lg:pb-12 lg:border-b border-deep-ink/5 last:border-b-0 hover:translate-x-2 transition-transform duration-300">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-gradient-to-br from-hi-yellow/20 to-hi-yellow/5 border-2 border-hi-yellow/30 text-deep-ink font-bold text-lg lg:text-xl group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </div>
                  {idx < 3 && <div className="w-1 h-12 lg:h-16 bg-gradient-to-b from-hi-yellow/30 to-transparent mt-2" />}
                </div>
                <div className="flex-grow pt-2">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{item.icon}</span>
                    <div>
                      <h3 className="text-2xl font-semibold font-serif text-deep-ink">{item.title}</h3>
                    </div>
                  </div>
                  <p className="text-slate leading-relaxed text-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-soft-meadow/60 to-soft-meadow/20 py-32 border-t border-deep-ink/5">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="space-y-8">
            <h2 className="text-5xl lg:text-6xl font-bold font-serif">Ready to transform your practice?</h2>
            <p className="text-xl text-slate max-w-2xl mx-auto leading-8">
              Join doctors already using Noa to save hours on documentation while improving patient care.
            </p>
            <Link href="/auth/signup?type=doctor" className="inline-block group">
              <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8 py-4 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 group-hover:translate-y-[-2px]">
                Start Your Free Trial
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-deep-ink/10 bg-canvas py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <h4 className="font-semibold font-serif text-deep-ink text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-slate hover:text-deep-ink transition-colors duration-200">Features</a></li>
                <li><a href="#" className="text-slate hover:text-deep-ink transition-colors duration-200">Pricing</a></li>
                <li><a href="#" className="text-slate hover:text-deep-ink transition-colors duration-200">Security</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold font-serif text-deep-ink text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-slate hover:text-deep-ink transition-colors duration-200">About</a></li>
                <li><a href="#" className="text-slate hover:text-deep-ink transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="text-slate hover:text-deep-ink transition-colors duration-200">Contact</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold font-serif text-deep-ink text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-slate hover:text-deep-ink transition-colors duration-200">Privacy</a></li>
                <li><a href="#" className="text-slate hover:text-deep-ink transition-colors duration-200">Terms</a></li>
                <li><a href="#" className="text-slate hover:text-deep-ink transition-colors duration-200">Compliance</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold font-serif text-deep-ink text-sm uppercase tracking-wider">Follow</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-slate hover:text-deep-ink transition-colors duration-200">Twitter</a></li>
                <li><a href="#" className="text-slate hover:text-deep-ink transition-colors duration-200">LinkedIn</a></li>
                <li><a href="#" className="text-slate hover:text-deep-ink transition-colors duration-200">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-deep-ink/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate">&copy; 2026 Noa. Medical AI that listens.</p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-slate hover:text-deep-ink transition-colors">HIPAA Compliant</a>
              <a href="#" className="text-slate hover:text-deep-ink transition-colors">SOC 2 Certified</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
