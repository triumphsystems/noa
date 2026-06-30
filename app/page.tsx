import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      {/* Navigation */}
      <nav className="border-b border-deep-ink/20 bg-soft-meadow/50">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold font-serif">Noa</div>
          <div className="flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium hover:text-slate transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-slate transition-colors">
              How It Works
            </Link>
            <div className="flex gap-3">
              <Link href="/auth/login">
                <Button variant="outline" className="rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow">
                  Log In
                </Button>
              </Link>
              <Link href="/intake">
                <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-semibold">
                  Speak with Noa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold font-serif leading-tight mb-6 text-balance">
                Medical memory, powered by AI
              </h1>
              <p className="text-lg text-slate mb-8 leading-relaxed">
                Noa transforms your voice into structured clinical intelligence. Document consultations naturally, get instant SOAP notes, and never lose patient context.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/intake">
                  <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8 py-6 text-base font-semibold">
                    Speak with Noa
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow px-8 py-6 text-base"
                  >
                    Log In
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Card — SOAP note preview */}
            <div className="rounded-3xl bg-white border border-deep-ink/10 shadow-sm p-7 flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate">Session active</p>
                  <p className="text-base font-semibold font-serif text-deep-ink mt-0.5">Dr. Adebayo — Patient #4821</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-moss-green animate-pulse" />
                  <span className="text-xs font-medium text-slate">Live</span>
                </div>
              </div>

              {/* SOAP sections */}
              <div className="space-y-3">
                {[
                  { label: 'S', heading: 'Subjective', text: 'Patient reports persistent dry cough for 3 weeks, mild fever.' },
                  { label: 'O', heading: 'Objective', text: 'Temp 37.9 °C. Chest clear on auscultation. SpO₂ 98%.' },
                  { label: 'A', heading: 'Assessment', text: 'Likely viral upper respiratory tract infection.' },
                  { label: 'P', heading: 'Plan', text: 'Rest, fluids, paracetamol PRN. Follow up in 5 days.' },
                ].map(({ label, heading, text }) => (
                  <div key={label} className="flex gap-3 items-start">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-hi-yellow text-xs font-bold text-deep-ink">
                      {label}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate">{heading}</p>
                      <p className="text-sm leading-5 text-deep-ink">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-deep-ink/8 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate">Live processing</p>
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-moss-green animate-pulse" />
                  <div className="h-2 w-2 rounded-full bg-hi-yellow animate-pulse [animation-delay:150ms]" />
                  <div className="h-2 w-2 rounded-full bg-slate/40 animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-soft-meadow/50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-4xl font-bold font-serif text-center mb-16">
            Clinical intelligence at your voice
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Voice First',
                description: 'Speak naturally during consultations. AI captures every detail automatically.',
              },
              {
                title: 'Instant Notes',
                description: 'SOAP notes generated in real-time as you talk with patients.',
              },
              {
                title: 'Patient Context',
                description: 'Complete patient history and previous sessions at your fingertips.',
              },
              {
                title: 'Clinical Intelligence',
                description: 'AI-powered insights and summaries from clinical conversations.',
              },
              {
                title: 'Secure & Compliant',
                description: 'Enterprise-grade encryption and full HIPAA compliance.',
              },
              {
                title: 'Seamless Integration',
                description: 'Works with your existing EHR and clinical workflows.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 border border-deep-ink/10">
                <h3 className="text-xl font-semibold font-serif text-deep-ink mb-3">{feature.title}</h3>
                <p className="text-slate leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-4xl font-bold font-serif text-center mb-16">How Noa works</h2>

          <div className="space-y-12">
            {[
              {
                step: '1',
                title: 'Start a Session',
                description: 'Open a voice session and begin consulting with your patient naturally.',
              },
              {
                step: '2',
                title: 'AI Listens',
                description: 'Nova AI transcribes and understands clinical context in real-time.',
              },
              {
                step: '3',
                title: 'Structured Notes',
                description: 'SOAP notes are automatically generated and ready for signing off.',
              },
              {
                step: '4',
                title: 'Patient Summary',
                description: 'Patients receive consultation summaries and next steps automatically.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-hi-yellow text-deep-ink font-bold">
                    {item.step}
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-semibold font-serif text-deep-ink mb-2">{item.title}</h3>
                  <p className="text-slate leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-soft-meadow/50 py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-4xl font-bold font-serif mb-6">Ready to transform your practice?</h2>
          <p className="text-lg text-slate mb-8 max-w-2xl mx-auto">
            Join doctors already using Noa to save hours on documentation while improving patient care.
          </p>
          <Link href="/intake">
            <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8 py-6 text-base font-semibold">
              Speak with Noa
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-deep-ink/20 bg-soft-meadow/30 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold font-serif text-deep-ink mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate">
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold font-serif text-deep-ink mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate">
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold font-serif text-deep-ink mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate">
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold font-serif text-deep-ink mb-4">Follow</h4>
              <ul className="space-y-2 text-sm text-slate">
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-deep-ink transition-colors">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-deep-ink/20 pt-8 text-center text-sm text-slate">
            <p>&copy; 2026 Noa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
