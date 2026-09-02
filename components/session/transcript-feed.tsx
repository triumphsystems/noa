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
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate" />
            Live Consultation Transcript
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-medium">
            {transcripts.length} entries
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 overflow-y-auto space-y-3 bg-soft-meadow/40 rounded-2xl p-4 border border-deep-ink/5">
          {transcripts.map((item, idx) => (
            <div key={idx} className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    item.role === 'doctor'
                      ? 'default'
                      : item.role === 'patient'
                        ? 'success'
                        : 'draft'
                  }
                  className="text-[10px] font-semibold uppercase px-2 py-0.5"
                >
                  {item.role}
                </Badge>
                <span className="text-[11px] text-slate font-mono">{item.timestamp}</span>
              </div>
              <p className="text-deep-ink pl-1 leading-relaxed text-sm">{item.text}</p>
            </div>
          ))}
          <div ref={feedEndRef} />
        </div>
      </CardContent>
    </Card>
  )
}
