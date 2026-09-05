'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Mic, Volume2 } from 'lucide-react'

export interface TranscriptItem {
  role: 'doctor' | 'patient' | 'system' | 'ai'
  text: string
  timestamp: string
}

interface TranscriptFeedProps {
  transcripts: TranscriptItem[]
  isRecording?: boolean
  className?: string
}

export function TranscriptFeed({ transcripts, isRecording, className }: TranscriptFeedProps) {
  const feedEndRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcripts])

  return (
    <Card className={`border border-deep-ink/8 bg-white shadow-editorial font-sans ${className || ''}`}>
      <CardHeader className="pb-3 border-b border-deep-ink/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate" />
            Live Consultation Transcript
          </CardTitle>
          {transcripts.length > 0 ? (
            <span className="text-xs font-mono text-slate/80 bg-soft-meadow px-2.5 py-0.5 rounded-full border border-deep-ink/5">
              {transcripts.length} turns
            </span>
          ) : isRecording ? (
            <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 animate-pulse flex items-center gap-1.5">
              <Volume2 className="w-3 h-3" />
              Transcribing audio...
            </span>
          ) : (
            <span className="text-xs text-slate">Awaiting session</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {transcripts.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-center p-6 bg-canvas/40 rounded-xl border border-dashed border-deep-ink/10 text-slate space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-soft-meadow flex items-center justify-center text-slate">
              <Mic className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-deep-ink">No conversation captured yet</p>
            <p className="text-xs text-slate max-w-sm leading-relaxed">
              {isRecording
                ? 'Speak clearly into your microphone. Clinical speech will be transcribed and attributed in real time.'
                : 'Start consultation recording to begin real-time speech capture and turn-by-turn clinical dialogue.'}
            </p>
          </div>
        ) : (
          <div className="h-80 overflow-y-auto space-y-2.5 bg-canvas/60 rounded-xl p-3.5 border border-deep-ink/6">
            {transcripts.map((item, idx) => (
              <div key={idx} className="text-xs space-y-1.5 bg-white p-3 rounded-lg border border-deep-ink/5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      item.role === 'doctor'
                        ? 'default'
                        : item.role === 'patient'
                          ? 'secondary'
                          : 'draft'
                    }
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                  >
                    {item.role}
                  </Badge>
                  <span className="text-[10px] text-slate/70 font-mono">{item.timestamp}</span>
                </div>
                <p className="text-deep-ink leading-relaxed text-xs sm:text-sm">{item.text}</p>
              </div>
            ))}
            <div ref={feedEndRef} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
