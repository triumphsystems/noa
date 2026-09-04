'use client'

type ConversationItem = {
  id: string
  role: 'assistant' | 'patient' | 'system'
  text: string
}

type ConversationLogProps = {
  items: ConversationItem[]
}

export function ConversationLog({ items }: ConversationLogProps) {
  return (
    <div className="rounded-3xl border border-deep-ink/10 bg-white p-4 sm:p-6 shadow-sm">
      <h2 className="text-base font-semibold font-serif mb-3 sm:mb-4 text-deep-ink">
        Conversation History
      </h2>
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
              item.role === 'assistant'
                ? 'bg-soft-meadow/60 text-deep-ink border border-deep-ink/5'
                : 'bg-canvas text-deep-ink border border-deep-ink/10'
            }`}
          >
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate font-medium">
              {item.role === 'assistant' ? 'Noa' : 'You'}
            </p>
            <p>{item.text}</p>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-deep-ink/15 p-4 text-xs text-slate text-center">
            Speech dialogue will record here automatically.
          </div>
        )}
      </div>
    </div>
  )
}
