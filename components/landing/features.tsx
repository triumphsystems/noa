import {
  ArrowRight,
  Brain,
  FileText,
  Layers,
  Mic,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

const CLINICAL_FEATURES = [
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
] as const;

export function LandingFeatures() {
  return (
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
          {CLINICAL_FEATURES.map((feature, idx) => {
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
  );
}