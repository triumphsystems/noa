'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Mic, Volume2 } from 'lucide-react';

export interface TranscriptItem {
  role: 'doctor' | 'patient' | 'system' | 'ai';
  text: string;
  timestamp: string;
}

interface TranscriptFeedProps {
  transcripts: TranscriptItem[];
  isRecording?: boolean;
  className?: string;
}

export function TranscriptFeed({
  transcripts,
  isRecording,
  className,
}: TranscriptFeedProps) {
  const feedEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <Card
      className={`border-deep-ink/8 shadow-editorial border bg-white font-sans ${className || ''}`}
    >
      <CardHeader className="border-deep-ink/5 border-b pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="text-slate h-4 w-4" />
            Live Consultation Transcript
          </CardTitle>
          {transcripts.length > 0 ? (
            <span className="text-slate/80 bg-soft-meadow border-deep-ink/5 rounded-full border px-2.5 py-0.5 font-mono text-xs">
              {transcripts.length} turns
            </span>
          ) : isRecording ? (
            <span className="flex animate-pulse items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-600">
              <Volume2 className="h-3 w-3" />
              Transcribing audio...
            </span>
          ) : (
            <span className="text-slate text-xs">Awaiting session</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {transcripts.length === 0 ? (
          <div className="bg-canvas/40 border-deep-ink/10 text-slate flex h-80 flex-col items-center justify-center space-y-2.5 rounded-xl border border-dashed p-6 text-center">
            <div className="bg-soft-meadow text-slate flex h-10 w-10 items-center justify-center rounded-full">
              <Mic className="h-5 w-5" />
            </div>
            <p className="text-deep-ink text-xs font-semibold">
              No conversation captured yet
            </p>
            <p className="text-slate max-w-sm text-xs leading-relaxed">
              {isRecording
                ? 'Speak clearly into your microphone. Clinical speech will be transcribed and attributed in real time.'
                : 'Start consultation recording to begin real-time speech capture and turn-by-turn clinical dialogue.'}
            </p>
          </div>
        ) : (
          <div className="bg-canvas/60 border-deep-ink/6 h-80 space-y-2.5 overflow-y-auto rounded-xl border p-3.5">
            {transcripts.map((item, idx) => (
              <div
                key={idx}
                className="border-deep-ink/5 space-y-1.5 rounded-lg border bg-white p-3 text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      item.role === 'doctor'
                        ? 'default'
                        : item.role === 'patient'
                          ? 'secondary'
                          : 'draft'
                    }
                    className="rounded px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
                  >
                    {item.role}
                  </Badge>
                  <span className="text-slate/70 font-mono text-[10px]">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-deep-ink text-xs leading-relaxed sm:text-sm">
                  {item.text}
                </p>
              </div>
            ))}
            <div ref={feedEndRef} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
