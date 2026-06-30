interface Transcript {
  role: 'doctor' | 'patient' | 'system' | 'ai'
  text: string
  timestamp: string
}

interface SessionTranscriptDisplayProps {
  transcripts: Transcript[]
}

const roleStyles: Record<string, string> = {
  doctor: 'bg-hi-yellow text-deep-ink',
  patient: 'bg-moss-green/20 text-deep-ink',
  system: 'bg-slate/20 text-slate',
  ai: 'bg-fuchsia/20 text-deep-ink',
}

export function SessionTranscriptDisplay({ transcripts }: SessionTranscriptDisplayProps) {
  if (transcripts.length === 0) return null

  return (
    <div className="bg-white rounded-3xl p-6 border border-deep-ink/10">
      <h3 className="text-lg font-semibold font-serif mb-4">Live Transcript</h3>
      <div className="h-64 overflow-y-auto space-y-3 bg-soft-meadow/30 rounded-2xl p-4">
        {transcripts.map((transcript, idx) => (
          <div key={idx} className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  roleStyles[transcript.role] || 'bg-slate/20 text-slate'
                }`}
              >
                {transcript.role.charAt(0).toUpperCase() + transcript.role.slice(1)}
              </span>
              <span className="text-xs text-slate">{transcript.timestamp}</span>
            </div>
            <p className="text-deep-ink ml-2">{transcript.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
