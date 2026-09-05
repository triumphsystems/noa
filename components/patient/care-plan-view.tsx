import { Card } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface CarePlanViewProps {
  summary: string;
  recommendations: string[];
  nextSteps: string;
}

export function CarePlanView({
  summary,
  recommendations,
  nextSteps,
}: CarePlanViewProps) {
  return (
    <Card className="space-y-6 p-4 sm:space-y-8 sm:p-8">
      <div>
        <h3 className="text-deep-ink mb-3 font-serif text-xl font-bold">
          Visit Summary
        </h3>
        <p className="text-slate text-sm leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      </div>

      <div className="border-deep-ink/10 border-t pt-6">
        <h3 className="text-deep-ink mb-4 font-serif text-xl font-bold">
          Your Care Plan
        </h3>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="bg-soft-meadow/50 border-deep-ink/5 flex items-start gap-3.5 rounded-2xl border p-4"
            >
              <div className="bg-hi-yellow text-deep-ink mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {idx + 1}
              </div>
              <p className="text-deep-ink text-sm leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-deep-ink/10 border-t pt-6">
        <h3 className="text-deep-ink mb-3 font-serif text-xl font-bold">
          Next Steps
        </h3>
        <div className="bg-moss-green/10 border-moss-green/20 text-deep-ink flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed">
          <CheckCircle2 className="text-moss-green mt-0.5 h-5 w-5 shrink-0" />
          <p>{nextSteps}</p>
        </div>
      </div>
    </Card>
  );
}
