'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, Square, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioRecorderControlProps {
  isRecording: boolean
  sessionDuration: number
  selectedPatient: string
  onStartRecording: () => void
  onStopRecording: () => void
}

export function AudioRecorderControl({
  isRecording,
  sessionDuration,
  selectedPatient,
  onStartRecording,
  onStopRecording,
}: AudioRecorderControlProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <Card className="p-6 sm:p-8 bg-white border border-deep-ink/8 shadow-editorial text-center font-sans">
      <div className="flex items-center justify-center mb-4">
        <div
          className={cn(
            'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-2xs',
            isRecording
              ? 'bg-rose-50 text-rose-700 border-rose-200 ring-4 ring-rose-100 animate-pulse'
              : 'bg-soft-meadow text-deep-ink border-deep-ink/10'
          )}
        >
          {isRecording ? (
            <Square className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-rose-600" />
          ) : (
            <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-deep-ink" />
          )}
        </div>
      </div>

      <div className="mb-6 space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          {isRecording && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <Radio className="w-3 h-3 animate-pulse" />
              Live Consultation Recording
            </span>
          )}
          {!isRecording && (
            <p className="text-slate text-xs sm:text-sm font-medium">
              {selectedPatient ? 'Ready to begin clinical recording' : 'Select a patient above to start consultation'}
            </p>
          )}
        </div>
        <p className="text-3xl sm:text-4xl font-bold font-mono text-deep-ink tracking-tight">
          {formatDuration(sessionDuration)}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 w-full sm:w-auto max-w-sm mx-auto">
        {!isRecording ? (
          <Button
            onClick={onStartRecording}
            disabled={!selectedPatient}
            variant="default"
            className="w-full sm:w-auto rounded-full px-8 py-2.5 h-11 font-semibold gap-2 shadow-2xs text-xs sm:text-sm bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mic className="h-4 w-4" />
            Start Consultation Recording
          </Button>
        ) : (
          <Button
            onClick={onStopRecording}
            variant="destructive"
            className="w-full sm:w-auto rounded-full px-8 py-2.5 h-11 font-semibold gap-2 shadow-2xs text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
          >
            <Square className="h-4 w-4 fill-current" />
            End Session & Synthesize SOAP
          </Button>
        )}
      </div>

      {!selectedPatient && (
        <p className="text-xs text-slate mt-4">
          * Please select a patient record above before starting the recording.
        </p>
      )}
    </Card>
  )
}
