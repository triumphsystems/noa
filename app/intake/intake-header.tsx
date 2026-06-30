import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function IntakeHeader() {
  return (
    <header className="mb-8 flex items-start justify-between gap-6 border-b border-deep-ink/10 pb-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-hi-yellow/15 border border-hi-yellow/30 px-3 py-1 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-hi-yellow" />
          <p className="text-xs font-semibold uppercase tracking-widest text-deep-ink">Voice intake</p>
        </div>
        <h1 className="text-3xl font-bold font-serif text-deep-ink">Talk, don&apos;t type</h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate">
          One microphone. No forms. Noa listens, understands, and asks follow-up questions naturally.
        </p>
      </div>
      <Link href="/" className="shrink-0 mt-1">
        <Button variant="outline" className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow text-sm">
          Exit
        </Button>
      </Link>
    </header>
  )
}
