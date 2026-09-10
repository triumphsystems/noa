import { Card } from '@/components/ui/card';

const WORKFLOW_STEPS = [
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
] as const;

export function LandingWorkflow() {
  return (
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
          {WORKFLOW_STEPS.map((item, idx) => (
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
  );
}
