'use client';

import { Mic } from 'lucide-react';

type AudioWaveformProps = {
  isRecording: boolean;
  isListening: boolean;
  transcriptPreview: string;
  defaultPrompt: string;
};

export function AudioWaveform({
  isRecording,
  isListening,
  transcriptPreview,
  defaultPrompt,
}: AudioWaveformProps) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all sm:rounded-3xl sm:p-5 ${
        isRecording
          ? 'border-hi-yellow/80 ring-hi-yellow/20 bg-white shadow-md ring-2'
          : 'border-deep-ink/10 bg-canvas'
      }`}
    >
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <p className="text-slate text-[11px] font-medium tracking-[0.25em] uppercase">
          Live Speech Transcript
        </p>

        {isRecording && (
          <div className="flex items-center gap-1">
            <span className="bg-deep-ink h-3 w-1 animate-pulse rounded-full [animation-delay:0ms]" />
            <span className="bg-hi-yellow h-5 w-1 animate-pulse rounded-full [animation-delay:150ms]" />
            <span className="bg-deep-ink h-6 w-1 animate-pulse rounded-full [animation-delay:300ms]" />
            <span className="bg-hi-yellow h-4 w-1 animate-pulse rounded-full [animation-delay:75ms]" />
            <span className="bg-deep-ink h-2 w-1 animate-pulse rounded-full [animation-delay:200ms]" />
          </div>
        )}
      </div>

      <div className="flex min-h-20 flex-col justify-center sm:min-h-24">
        {transcriptPreview ? (
          <p className="text-deep-ink text-sm leading-6 font-medium sm:text-base sm:leading-7">
            "{transcriptPreview}"
            {isRecording && (
              <span className="bg-hi-yellow ml-1 inline-block h-4 w-1.5 animate-pulse" />
            )}
          </p>
        ) : (
          <div className="py-2 text-center sm:text-left">
            <p className="text-slate/70 flex items-center gap-1.5 text-xs italic sm:text-sm">
              <Mic className="text-slate/40 h-3.5 w-3.5" />
              <span>{defaultPrompt}</span>
            </p>
          </div>
        )}
      </div>

      <div className="border-deep-ink/5 text-slate mt-2 flex items-center justify-between border-t pt-2 text-[11px]">
        <span>
          {isRecording
            ? isListening
              ? '• Streaming audio'
              : '• Initializing mic...'
            : '• Microphone idle'}
        </span>
        <span className="text-slate/60 text-[10px]">Auto-sends on pause</span>
      </div>
    </div>
  );
}
