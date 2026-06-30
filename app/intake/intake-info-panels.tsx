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
  return (
    <div className="space-y-5">
      {/* Assistant Message */}
      <div className="rounded-2xl bg-gradient-to-br from-hi-yellow/10 to-moss-green/10 border border-hi-yellow/20 p-6">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-hi-yellow">Noa listening</p>
          {isRecording && <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />}
        </div>
        <p className="text-lg font-medium leading-relaxed text-deep-ink">{assistantMessage}</p>
      </div>

      {/* Status Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-deep-ink/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate mb-2">Language detected</p>
          <p className="font-semibold text-deep-ink">{detectedLanguage}</p>
        </div>
        <div className="rounded-2xl border border-deep-ink/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate mb-2">Session status</p>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              isSubmitting ? 'bg-blue-500 animate-pulse' : 
              isRecording ? 'bg-green-500 animate-pulse' : 
              isComplete ? 'bg-green-600' : 'bg-slate-400'
            }`} />
            <p className="font-semibold text-deep-ink">
              {isSubmitting ? 'Processing' : isRecording ? 'Listening' : isComplete ? 'Complete' : 'Ready'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {supportMessage && (
        <div className="rounded-2xl border border-amber-200/50 bg-amber-50/50 p-5 text-sm text-amber-900">
          <p className="font-medium mb-1">Tip:</p>
          <p>{supportMessage}</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200/50 bg-red-50/50 p-5 text-sm text-red-700">
          <p className="font-medium mb-1">Issue detected:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Live Transcript */}
      <div className="rounded-2xl border-2 border-dashed border-deep-ink/20 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate mb-4">Live transcript</p>
        <p className="min-h-20 text-base leading-7 text-deep-ink font-medium">
          {transcriptPreview || (
            <span className="text-slate italic">Tap microphone and speak naturally...</span>
          )}
        </p>
      </div>

      {/* Recording Indicator */}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate">
        <div className={`h-1.5 w-1.5 rounded-full ${
          isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'
        }`} />
        {isRecording ? (isListening ? 'Actively listening...' : 'Starting microphone...') : 'Microphone idle'}
      </div>
    </div>
  )
}
