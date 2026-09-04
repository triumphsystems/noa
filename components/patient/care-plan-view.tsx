import { Card } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

interface CarePlanViewProps {
  summary: string
  recommendations: string[]
  nextSteps: string
}

export function CarePlanView({ summary, recommendations, nextSteps }: CarePlanViewProps) {
  return (
    <Card className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      <div>
        <h3 className="text-xl font-bold font-serif text-deep-ink mb-3">Visit Summary</h3>
        <p className="text-slate leading-relaxed whitespace-pre-line text-sm">{summary}</p>
      </div>

      <div className="border-t border-deep-ink/10 pt-6">
        <h3 className="text-xl font-bold font-serif text-deep-ink mb-4">Your Care Plan</h3>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="flex gap-3.5 p-4 bg-soft-meadow/50 rounded-2xl border border-deep-ink/5 items-start">
              <div className="w-6 h-6 rounded-full bg-hi-yellow flex items-center justify-center font-bold text-xs text-deep-ink shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-sm text-deep-ink leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-deep-ink/10 pt-6">
        <h3 className="text-xl font-bold font-serif text-deep-ink mb-3">Next Steps</h3>
        <div className="p-4 bg-moss-green/10 rounded-2xl border border-moss-green/20 text-sm text-deep-ink leading-relaxed flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-moss-green shrink-0 mt-0.5" />
          <p>{nextSteps}</p>
        </div>
      </div>
    </Card>
  )
}
