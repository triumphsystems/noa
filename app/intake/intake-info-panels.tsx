interface IntakeInfoPanelsProps {
  assistantMessage: string
  detectedLanguage: string
  isSubmitting: boolean
  isRecording: boolean
  isComplete: boolean
  supportMessage: string
  error: string
  transcriptPreview: string
  isListening: boolean
}

export function IntakeInfoPanels({
  assistantMessage,
  detectedLanguage,
  isSubmitting,
  isRecording,
  isComplete,
  supportMessage,
  error,
  transcriptPreview,
  isListening,
}: IntakeInfoPanelsProps) {
  const statusLabel = isSubmitting ? 'Processing' : isRecording ? 'Listening' : isComplete ? 'Complete' : 'Ready'
  const statusColor = isSubmitting
    ? 'bg-fuchsia'
    : isRecording
    ? 'bg-moss-green'
    : isComplete
    ? 'bg-moss-green'
    : 'bg-slate/40'

  return (
    <div className="space-y-4">
      {/* Noa prompt */}
      <div className="rounded-2xl border border-deep-ink/8 bg-soft-meadow/60 px-5 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate">Noa says</p>
        <p className="text-lg font-medium leading-7 text-deep-ink">{assistantMessage}</p>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-deep-ink/8 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate mb-1">Language</p>
          <p className="text-sm font-semibold text-deep-ink">{detectedLanguage}</p>
        </div>
        <div className="rounded-xl border border-deep-ink/8 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${statusColor} ${isRecording || isSubmitting ? 'animate-pulse' : ''}`} />
            <p className="text-sm font-semibold text-deep-ink">{statusLabel}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {supportMessage && (
        <div className="rounded-xl border border-hi-yellow/40 bg-hi-yellow/10 px-4 py-3 text-sm text-deep-ink">
          {supportMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Live transcript */}
      <div className="rounded-2xl border border-deep-ink/8 bg-white px-5 py-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate">Live transcript</p>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate">
              <span className="h-1.5 w-1.5 rounded-full bg-moss-green animate-pulse" />
              {isListening ? 'Listening' : 'Starting...'}
            </span>
          )}
        </div>
        <p className="min-h-20 text-sm leading-6 text-deep-ink">
          {transcriptPreview || <span className="text-slate/60 italic">Tap the microphone and speak naturally...</span>}
        </p>
      </div>
    </div>
  )
}
