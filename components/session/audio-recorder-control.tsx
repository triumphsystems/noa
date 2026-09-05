'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioRecorderControlProps {
  isRecording: boolean;
  sessionDuration: number;
  selectedPatient: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function AudioRecorderControl({
  isRecording,
  sessionDuration,
  selectedPatient,
  onStartRecording,
  onStopRecording,
}: AudioRecorderControlProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Card className="border-deep-ink/8 shadow-editorial border bg-white p-6 text-center font-sans sm:p-8">
      <div className="mb-4 flex items-center justify-center">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl border shadow-2xs transition-all duration-300 sm:h-20 sm:w-20',
            isRecording
              ? 'animate-pulse border-rose-200 bg-rose-50 text-rose-700 ring-4 ring-rose-100'
              : 'bg-soft-meadow text-deep-ink border-deep-ink/10'
          )}
        >
          {isRecording ? (
            <Square className="h-6 w-6 fill-current text-rose-600 sm:h-7 sm:w-7" />
          ) : (
            <Mic className="text-deep-ink h-6 w-6 sm:h-7 sm:w-7" />
          )}
        </div>
      </div>

      <div className="mb-6 space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          {isRecording && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
              <Radio className="h-3 w-3 animate-pulse" />
              Live Consultation Recording
            </span>
          )}
          {!isRecording && (
            <p className="text-slate text-xs font-medium sm:text-sm">
              {selectedPatient
                ? 'Ready to begin clinical recording'
                : 'Select a patient above to start consultation'}
            </p>
          )}
        </div>
        <p className="text-deep-ink font-mono text-3xl font-bold tracking-tight sm:text-4xl">
          {formatDuration(sessionDuration)}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-sm items-center justify-center gap-3 sm:w-auto">
        {!isRecording ? (
          <Button
            onClick={onStartRecording}
            disabled={!selectedPatient}
            variant="default"
            className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 h-11 w-full cursor-pointer gap-2 rounded-full px-8 py-2.5 text-xs font-semibold shadow-2xs disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-sm"
          >
            <Mic className="h-4 w-4" />
            Start Consultation Recording
          </Button>
        ) : (
          <Button
            onClick={onStopRecording}
            variant="destructive"
            className="h-11 w-full cursor-pointer gap-2 rounded-full bg-rose-600 px-8 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-rose-700 sm:w-auto sm:text-sm"
          >
            <Square className="h-4 w-4 fill-current" />
            End Session & Synthesize SOAP
          </Button>
        )}
      </div>

      {!selectedPatient && (
        <p className="text-slate mt-4 text-xs">
          * Please select a patient record above before starting the recording.
        </p>
      )}
    </Card>
  );
}
