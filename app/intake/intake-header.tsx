import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function IntakeHeader() {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-hi-yellow font-semibold mb-2">
          Voice intake
        </p>
        <h1 className="text-3xl font-bold font-serif">Talk, don&apos;t type</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate">
          One microphone. No forms. Noa will listen, translate, and ask the next question
          conversationally.
        </p>
      </div>
      <Link href="/">
        <Button variant="outline" className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow">
          Exit
        </Button>
      </Link>
    </header>
  )
}
