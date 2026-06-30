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
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-deep-ink/6 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate shrink-0">{label}</span>
      <span className="text-right text-xs font-medium text-deep-ink">{value}</span>
    </div>
  )
}

export function IntakeSidebar({ chatItems, draft, canPersist, isComplete }: IntakeSidebarProps) {
  return (
    <aside className="space-y-4">
      {/* Conversation log */}
      <div className="rounded-2xl border border-deep-ink/10 bg-white p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate">Conversation</h2>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {chatItems.map(item => (
            <div
              key={item.id}
              className={`rounded-xl px-3.5 py-2.5 text-xs leading-5 ${
                item.role === 'assistant'
                  ? 'bg-soft-meadow text-deep-ink'
                  : 'bg-canvas text-deep-ink border border-deep-ink/8'
              }`}
            >
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate">{item.role}</p>
              <p>{item.text}</p>
            </div>
          ))}
          {chatItems.length === 0 && (
            <p className="rounded-xl border border-dashed border-deep-ink/15 px-4 py-5 text-xs text-slate text-center">
              Conversation will appear here as Noa asks questions.
            </p>
          )}
        </div>
      </div>

      {/* Captured data */}
      <div className="rounded-2xl border border-deep-ink/10 bg-white p-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate">Captured so far</h2>
        <div>
          <Row label="Name" value={`${draft.firstName || '—'} ${draft.lastName || ''}`.trim()} />
          <Row label="DOB" value={draft.dateOfBirth || '—'} />
          <Row label="Email" value={draft.email || '—'} />
          <Row label="Phone" value={draft.phone || '—'} />
          <Row label="Conditions" value={draft.medicalConditions?.join(', ') || '—'} />
          <Row label="Allergies" value={draft.allergies?.join(', ') || '—'} />
          <Row label="Emergency" value={draft.emergencyContactName || '—'} />
        </div>
      </div>

      {/* Next step hint */}
      {(canPersist || isComplete) && (
        <div className="rounded-2xl border border-hi-yellow/30 bg-hi-yellow/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-deep-ink mb-1">Next step</p>
          <p className="text-sm text-deep-ink leading-5">
            {isComplete ? 'Intake complete. Your information is ready to save.' : 'Keep going — we can save once you finish.'}
          </p>
        </div>
      )}
    </aside>
  )
}
