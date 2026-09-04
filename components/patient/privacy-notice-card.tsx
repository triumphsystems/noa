import { Card } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'

export function PrivacyNoticeCard() {
  return (
    <Card className="bg-soft-meadow border-deep-ink/10 p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="h-5 w-5 text-deep-ink" />
        <h3 className="text-lg font-semibold font-serif text-deep-ink">Patient Security & Privacy</h3>
      </div>
      <ul className="space-y-2 text-sm text-slate">
        <li className="flex gap-2">
          <span className="text-deep-ink">•</span>
          <span>All consultation transcripts and summaries are encrypted end-to-end.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-deep-ink">•</span>
          <span>You can download or print your consultation reports anytime.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-deep-ink">•</span>
          <span>Health records are only shared with licensed clinicians you have authorized.</span>
        </li>
      </ul>
    </Card>
  )
}
