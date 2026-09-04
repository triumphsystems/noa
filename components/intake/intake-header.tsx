'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function IntakeHeader() {
  return (
    <header className="mb-6 flex items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="group flex items-center gap-2.5 shrink-0">
          <img
            src="/logo.svg"
            alt="Noa Logo"
            className="w-9 h-9 rounded-xl border border-deep-ink/15 shadow-2xs group-hover:scale-105 transition-transform"
          />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.25em] text-hi-yellow font-bold">
              Voice Check-in
            </p>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-hi-yellow/30 text-deep-ink px-1.5 py-0.5 rounded border border-hi-yellow/50">
              Live AI
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-deep-ink">Talk, don’t type</h1>
          <p className="text-xs sm:text-sm text-slate">
            Answer naturally in any language. Noa extracts details conversationally.
          </p>
        </div>
      </div>

      <Link href="/" className="shrink-0">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-deep-ink/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-deep-ink shadow-2xs hover:bg-soft-meadow transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Home</span>
        </button>
      </Link>
    </header>
  )
}
