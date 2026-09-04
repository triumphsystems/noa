'use client'

import Link from 'next/link'
import { ArrowLeft, Globe2 } from 'lucide-react'

type IntakeHeaderProps = {
  detectedLanguage?: string
  isSubmitting?: boolean
  isRecording?: boolean
  isComplete?: boolean
}

export function IntakeHeader({
  detectedLanguage = 'English',
  isSubmitting = false,
  isRecording = false,
  isComplete = false,
}: IntakeHeaderProps) {
  const statusLabel = isSubmitting
    ? 'Synthesizing'
    : isRecording
    ? 'Listening'
    : isComplete
    ? 'Complete'
    : 'Ready'

  return (
    <header className="flex items-center justify-between gap-2 pb-2.5 border-b border-deep-ink/8 shrink-0">
      {/* Brand & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/" className="group flex items-center gap-1.5 shrink-0">
          <img
            src="/logo.svg"
            alt="Noa Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-deep-ink/15 shadow-2xs group-hover:scale-105 transition-transform"
          />
          <span className="font-serif font-bold text-base sm:text-lg text-deep-ink tracking-tight">Noa</span>
        </Link>

        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-deep-ink/70 truncate hidden xs:inline">
          Check-in
        </span>
      </div>

      {/* Telemetry & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-deep-ink/10 text-[11px] text-deep-ink shadow-2xs">
          <Globe2 className="w-3 h-3 text-slate shrink-0" />
          <span className="font-medium truncate max-w-[65px] sm:max-w-none">{detectedLanguage || 'English'}</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-deep-ink/10 text-[11px] text-deep-ink shadow-2xs">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isRecording
                ? 'bg-red-500 animate-ping'
                : isSubmitting
                ? 'bg-amber-500 animate-pulse'
                : isComplete
                ? 'bg-emerald-500'
                : 'bg-emerald-600'
            }`}
          />
          <span className="font-medium text-[11px]">{statusLabel}</span>
        </div>

        <Link href="/" className="shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-deep-ink/15 bg-white px-2 py-1 text-[11px] font-semibold text-deep-ink shadow-2xs hover:bg-soft-meadow transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </Link>
      </div>
    </header>
  )
}
