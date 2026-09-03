'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

export interface TranscriptItem {
  role: 'doctor' | 'patient' | 'system' | 'ai'
  text: string
  timestamp: string
}

interface TranscriptFeedProps {
  transcripts: TranscriptItem[]
  className?: string
}

export function TranscriptFeed({ transcripts, className }: TranscriptFeedProps) {
  const feedEndRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcripts])

  if (transcripts.length === 0) {
    return null
  }

  return (
    <Card className={`border border-deep-ink/8 bg-white shadow-editorial font-sans ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate" />
            Live Transcript
          </CardTitle>
          <span className="text-xs font-mono text-slate/80 bg-soft-meadow px-2 py-0.5 rounded-md border border-deep-ink/5">
            {transcripts.length} turns
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 overflow-y-auto space-y-2.5 bg-canvas/60 rounded-xl p-3.5 border border-deep-ink/6">
          {transcripts.map((item, idx) => (
            <div key={idx} className="text-xs space-y-1 bg-white p-2.5 rounded-lg border border-deep-ink/5 shadow-2xs">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    item.role === 'doctor'
                      ? 'default'
                      : item.role === 'patient'
                        ? 'secondary'
                        : 'draft'
                  }
                  className="text-[10px] font-medium uppercase px-1.5 py-0.2 rounded"
                >
                  {item.role}
                </Badge>
                <span className="text-[10px] text-slate/70 font-mono">{item.timestamp}</span>
              </div>
              <p className="text-deep-ink leading-relaxed text-xs">{item.text}</p>
            </div>
          ))}
          <div ref={feedEndRef} />
        </div>
      </CardContent>
    </Card>
  )
}
