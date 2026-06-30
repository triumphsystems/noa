import type { IntakeConversationDraft } from '@/lib/voice-types'

interface ConversationEntry {
  id: string
  role: 'assistant' | 'patient' | 'system'
  text: string
}

interface IntakeSidebarProps {
  chatItems: ConversationEntry[]
  draft: IntakeConversationDraft
  canPersist: boolean
  isComplete: boolean
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-deep-ink/5 pb-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate">{label}</span>
      <span className="text-right text-sm font-medium text-deep-ink max-w-[60%] truncate">{value}</span>
    </div>
  )
}

export function IntakeSidebar({ chatItems, draft, canPersist, isComplete }: IntakeSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Conversation History */}
      <div className="rounded-3xl border border-deep-ink/10 bg-white p-6 shadow-lg max-h-80 overflow-y-auto">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate mb-4">Conversation</h2>
        <div className="space-y-3">
          {chatItems.map(item => (
            <div
              key={item.id}
              className={`rounded-xl px-4 py-3 text-sm leading-6 ${
                item.role === 'assistant'
                  ? 'bg-gradient-to-r from-hi-yellow/10 to-moss-green/10 border border-hi-yellow/20 text-deep-ink'
                  : 'bg-slate-50 text-deep-ink border border-deep-ink/5'
              }`}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate">{item.role}</p>
              <p className="text-xs leading-5">{item.text}</p>
            </div>
          ))}
          {chatItems.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-slate/20 p-4 text-xs text-slate text-center">
              Conversation will start here
            </div>
          )}
        </div>
      </div>

      {/* Captured Data */}
      <div className="rounded-3xl border border-deep-ink/10 bg-white p-6 shadow-lg">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate mb-5">Captured so far</h2>
        <div className="space-y-0">
          <Row label="Name" value={`${draft.firstName || '—'} ${draft.lastName || ''}`.trim()} />
          <Row label="DOB" value={draft.dateOfBirth || '—'} />
          <Row label="Email" value={draft.email || '—'} />
          <Row label="Phone" value={draft.phone || '—'} />
          <Row label="Conditions" value={draft.medicalConditions?.join(', ') || '—'} />
          <Row label="Allergies" value={draft.allergies?.join(', ') || '—'} />
          <Row label="Emergency" value={draft.emergencyContactName || '—'} />
        </div>
      </div>

      {/* Status Card */}
      <div className={`rounded-3xl border-2 p-6 ${
        isComplete 
          ? 'border-green-300 bg-green-50' 
          : 'border-hi-yellow/30 bg-hi-yellow/10'
      }`}>
        <h3 className="text-sm font-bold uppercase tracking-widest mb-2 text-deep-ink">Status</h3>
        <p className="text-sm text-deep-ink leading-6">
          {isComplete 
            ? '✓ Intake complete! Ready to save.' 
            : canPersist 
            ? 'Keep talking to complete your intake.' 
            : 'Start recording to begin.'}
        </p>
      </div>
    </aside>
  )
}
