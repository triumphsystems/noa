import { Card } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export function PrivacyNoticeCard() {
  return (
    <Card className="bg-soft-meadow border-deep-ink/10 p-6">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="text-deep-ink h-5 w-5" />
        <h3 className="text-deep-ink font-serif text-lg font-semibold">
          Patient Security & Privacy
        </h3>
      </div>
      <ul className="text-slate space-y-2 text-sm">
        <li className="flex gap-2">
          <span className="text-deep-ink">•</span>
          <span>
            All consultation transcripts and summaries are encrypted end-to-end.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-deep-ink">•</span>
          <span>
            You can download or print your consultation reports anytime.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-deep-ink">•</span>
          <span>
            Health records are only shared with licensed clinicians you have
            authorized.
          </span>
        </li>
      </ul>
    </Card>
  );
}
