'use client';

import { Globe2, Activity } from 'lucide-react';

type StatusLanguageGridProps = {
  detectedLanguage: string;
  isSubmitting: boolean;
  isRecording: boolean;
  isComplete: boolean;
};

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
        : 'Ready for speech';

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="border-deep-ink/10 bg-canvas rounded-2xl border p-3 shadow-2xs sm:p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <Globe2 className="text-slate h-3.5 w-3.5" />
          <p className="text-slate text-[10px] font-medium tracking-[0.2em] uppercase sm:text-xs">
            Language Auto-Detect
          </p>
        </div>
        <p className="text-deep-ink flex items-center gap-2 truncate text-sm font-semibold sm:text-base">
          <span>{detectedLanguage || 'English'}</span>
          <span className="text-slate bg-deep-ink/5 rounded px-1.5 py-0.5 text-[10px] font-normal">
            Multilingual
          </span>
        </p>
      </div>

      <div className="border-deep-ink/10 bg-canvas rounded-2xl border p-3 shadow-2xs sm:p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <Activity className="text-slate h-3.5 w-3.5" />
          <p className="text-slate text-[10px] font-medium tracking-[0.2em] uppercase sm:text-xs">
            Session Status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isRecording
                ? 'animate-ping bg-red-500'
                : isSubmitting
                  ? 'animate-pulse bg-amber-500'
                  : isComplete
                    ? 'bg-emerald-500'
                    : 'bg-deep-ink/30'
            }`}
          />
          <p className="text-deep-ink truncate text-sm font-semibold sm:text-base">
            {statusText}
          </p>
        </div>
      </div>
    </div>
  );
}
