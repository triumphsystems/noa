'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, Square, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioRecorderControlProps {
  isRecording: boolean
  sessionDuration: number
  selectedPatient: string
  onStartRecording: () => void
  onStopRecording: () => void
  onSimulate?: () => void
}

export function AudioRecorderControl({
  isRecording,
  sessionDuration,
  selectedPatient,
  onStartRecording,
  onStopRecording,
  onSimulate,
}: AudioRecorderControlProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <Card className="p-6 sm:p-8 bg-white border border-deep-ink/8 shadow-editorial text-center font-sans">
      <div className="flex items-center justify-center mb-5">
        <div
          className={cn(
            'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border transition-all duration-300',
            isRecording
              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
              : 'bg-soft-meadow text-deep-ink border-deep-ink/10'
          )}
        >
          {isRecording ? <Square className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
        </div>
      </div>

      <div className="mb-5 space-y-1">
        <p className="text-slate text-xs sm:text-sm font-medium">
          {isRecording ? 'Recording consultation in progress...' : 'Ready to begin consultation'}
        </p>
        <p className="text-2xl sm:text-3xl font-medium font-mono text-deep-ink tracking-tight">
          {formatDuration(sessionDuration)}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 flex-col sm:flex-row w-full sm:w-auto max-w-sm sm:max-w-none mx-auto">
        {!isRecording ? (
          <Button
            onClick={onStartRecording}
            disabled={!selectedPatient}
            variant="default"
            className="w-full sm:w-auto rounded-lg px-5 py-2 h-10 font-semibold gap-2 shadow-2xs text-xs"
          >
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={onStopRecording}
            variant="destructive"
            className="w-full sm:w-auto rounded-lg px-5 py-2 h-10 font-semibold gap-2 shadow-2xs text-xs"
          >
            <Square className="h-4 w-4 fill-current" />
            Stop Recording
          </Button>
        )}

        {onSimulate && !isRecording && (
          <Button
            variant="outline"
            onClick={onSimulate}
            className="w-full sm:w-auto rounded-lg h-10 px-4 gap-2 text-xs font-medium"
          >
            <Sparkles className="h-4 w-4 text-hi-yellow fill-hi-yellow" />
            Simulate Demo Audio
          </Button>
        )}
      </div>

      {!selectedPatient && (
        <p className="text-xs text-slate mt-4">
          * Please select a patient above to start the consultation recording.
        </p>
      )}
    </Card>
  )
}
