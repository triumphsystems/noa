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
                <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8 py-2 text-base font-semibold">
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
                <Link href="/auth/signup?type=doctor">
                  <Button
                    variant="outline"
                    className="rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow px-8 py-6 text-base font-semibold"
                  >
                    For Doctors
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Card with Decorative Elements */}
            <div className="relative h-96">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-moss-green/30 via-fuchsia/20 to-hi-yellow/20" />
              <div className="relative rounded-3xl bg-white border-2 border-deep-ink/10 p-8 h-full flex flex-col justify-between overflow-hidden">
                <div className="space-y-4">
                  <div className="h-3 bg-soft-meadow rounded-full w-full" />
                  <div className="h-3 bg-soft-meadow rounded-full w-5/6" />
                  <div className="space-y-2 pt-4">
                    <div className="h-2 bg-hi-yellow rounded-full w-2/3" />
                    <div className="h-2 bg-slate/30 rounded-full w-full" />
                    <div className="h-2 bg-slate/30 rounded-full w-4/5" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-8 border-t border-deep-ink/5">
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
              Start Your Free Trial
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
