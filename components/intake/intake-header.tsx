'use client';

import Link from 'next/link';
import { ArrowLeft, Globe2 } from 'lucide-react';

type IntakeHeaderProps = {
  detectedLanguage?: string;
  isSubmitting?: boolean;
  isRecording?: boolean;
  isComplete?: boolean;
};

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
        : 'Ready';

  return (
    <header className="border-deep-ink/8 flex shrink-0 items-center justify-between gap-2 border-b pb-2.5">
      {/* Brand & Title */}
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/" className="group flex shrink-0 items-center gap-1.5">
          <img
            src="/logo.svg"
            alt="Noa Logo"
            className="border-deep-ink/15 h-7 w-7 rounded-lg border shadow-2xs transition-transform group-hover:scale-105 sm:h-8 sm:w-8"
          />
          <span className="text-deep-ink font-serif text-base font-bold tracking-tight sm:text-lg">
            Noa
          </span>
        </Link>

        <span className="text-deep-ink/70 xs:inline hidden truncate text-[10px] font-bold tracking-wider uppercase sm:text-xs">
          Check-in
        </span>
      </div>

      {/* Telemetry & Controls */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="border-deep-ink/10 text-deep-ink flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[11px] shadow-2xs">
          <Globe2 className="text-slate h-3 w-3 shrink-0" />
          <span className="max-w-[65px] truncate font-medium sm:max-w-none">
            {detectedLanguage || 'English'}
          </span>
        </div>

        <div className="border-deep-ink/10 text-deep-ink flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[11px] shadow-2xs">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              isRecording
                ? 'animate-ping bg-red-500'
                : isSubmitting
                  ? 'animate-pulse bg-amber-500'
                  : isComplete
                    ? 'bg-emerald-500'
                    : 'bg-emerald-600'
            }`}
          />
          <span className="text-[11px] font-medium">{statusLabel}</span>
        </div>

        <Link href="/" className="shrink-0">
          <button
            type="button"
            className="border-deep-ink/15 text-deep-ink hover:bg-soft-meadow inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1 text-[11px] font-semibold shadow-2xs transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </Link>
      </div>
    </header>
  );
}
