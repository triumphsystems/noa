'use client'

import { Globe2, Activity } from 'lucide-react'

type StatusLanguageGridProps = {
  detectedLanguage: string
  isSubmitting: boolean
  isRecording: boolean
  isComplete: boolean
}

export function StatusLanguageGrid({
  detectedLanguage,
  isSubmitting,
  isRecording,
  isComplete,
}: StatusLanguageGridProps) {
  const statusText = isSubmitting
    ? 'Synthesizing...'
    : isRecording
    ? 'Listening live'
    : isComplete
    ? 'Complete'
    : 'Ready for speech'

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2">
      <div className="rounded-2xl border border-deep-ink/10 bg-canvas p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center gap-1.5 mb-1">
          <Globe2 className="w-3.5 h-3.5 text-slate" />
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate font-medium">
            Language Auto-Detect
          </p>
        </div>
        <p className="font-semibold text-sm sm:text-base text-deep-ink truncate flex items-center gap-2">
          <span>{detectedLanguage || 'English'}</span>
          <span className="text-[10px] font-normal text-slate bg-deep-ink/5 px-1.5 py-0.5 rounded">
            Multilingual
          </span>
        </p>
      </div>

      <div className="rounded-2xl border border-deep-ink/10 bg-canvas p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center gap-1.5 mb-1">
          <Activity className="w-3.5 h-3.5 text-slate" />
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate font-medium">
            Session Status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isRecording
                ? 'bg-red-500 animate-ping'
                : isSubmitting
                ? 'bg-amber-500 animate-pulse'
                : isComplete
                ? 'bg-emerald-500'
                : 'bg-deep-ink/30'
            }`}
          />
          <p className="font-semibold text-sm sm:text-base text-deep-ink truncate">{statusText}</p>
        </div>
      </div>
    </div>
  )
}
