import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function IntakeHeader() {
  return (
    <header className="mb-8 flex items-start justify-between gap-6">
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-hi-yellow mb-3">
          Voice intake
        </p>
        <h1 className="text-4xl lg:text-5xl font-bold font-serif text-deep-ink mb-3 leading-tight">
          Medical intake,{' '}
          <span className="text-hi-yellow">conversationally</span>
        </h1>
        <p className="text-base text-slate leading-relaxed max-w-2xl">
          Speak naturally about your medical history. Noa listens, learns, and asks clarifying questions—just like a real conversation.
        </p>
      </div>
      <Link href="/">
        <Button variant="outline" className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow shrink-0">
          Back
        </Button>
      </Link>
    </header>
  )
}
