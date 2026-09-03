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
    <Card className="p-5 sm:p-8 border-2 border-hi-yellow/30 bg-gradient-to-br from-soft-meadow via-white to-soft-meadow/50 text-center">
      <div className="flex items-center justify-center mb-6">
        <div
          className={cn(
            'w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300',
            isRecording
              ? 'bg-red-500 text-white border-red-400 animate-pulse ring-8 ring-red-100'
              : 'bg-soft-meadow text-deep-ink border-deep-ink/10'
          )}
        >
          {isRecording ? <Square className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> : <Mic className="w-6 h-6 sm:w-8 sm:h-8" />}
        </div>
      </div>

      <div className="mb-6 space-y-1">
        <p className="text-slate text-xs sm:text-sm font-medium">
          {isRecording ? 'Recording consultation in progress...' : 'Ready to begin consultation'}
        </p>
        <p className="text-2xl sm:text-3xl font-bold font-serif text-deep-ink tracking-tight">
          {formatDuration(sessionDuration)}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 flex-col sm:flex-row w-full sm:w-auto max-w-sm sm:max-w-none mx-auto">
        {!isRecording ? (
          <Button
            onClick={onStartRecording}
            disabled={!selectedPatient}
            className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-6 sm:px-8 py-5 font-semibold gap-2 shadow-xs text-sm"
          >
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={onStopRecording}
            className="w-full sm:w-auto rounded-full bg-red-600 text-white hover:bg-red-700 px-6 sm:px-8 py-5 font-semibold gap-2 shadow-xs text-sm"
          >
            <Square className="h-4 w-4 fill-current" />
            Stop Recording
          </Button>
        )}

        {onSimulate && !isRecording && (
          <Button
            variant="outline"
            onClick={onSimulate}
            className="w-full sm:w-auto rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow py-5 gap-2 text-sm"
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
