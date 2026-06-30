import { Button } from '@/components/ui/button'

interface SessionRecordingControlsProps {
  isRecording: boolean
  isSubmitting: boolean
  sessionDuration: number
  onStart: () => void
  onStop: () => void
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function SessionRecordingControls({
  isRecording,
  isSubmitting,
  sessionDuration,
  onStart,
  onStop,
}: SessionRecordingControlsProps) {
  return (
    <div className="bg-gradient-to-br from-soft-meadow to-soft-meadow/50 rounded-3xl p-8 border-2 border-hi-yellow/20">
      <div className="flex items-center justify-center mb-6">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isRecording ? 'bg-hi-yellow animate-pulse' : 'bg-soft-meadow'
          } border-2 border-deep-ink/20`}
        >
          <svg className="w-10 h-10 text-deep-ink" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-slate text-sm mb-2">
          {isRecording ? 'Recording in progress...' : 'Ready to record'}
        </p>
        <p className="text-2xl font-bold text-deep-ink">{formatDuration(sessionDuration)}</p>
      </div>

      <div className="flex gap-4 justify-center">
        {!isRecording ? (
          <Button
            onClick={onStart}
            className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8 py-3"
          >
            Start Recording
          </Button>
        ) : (
          <Button onClick={onStop} className="rounded-full bg-red-500 text-white hover:bg-red-600 px-8 py-3">
            Stop Recording
          </Button>
        )}
      </div>
    </div>
  )
}
