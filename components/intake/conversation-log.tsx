'use client';

type ConversationItem = {
  id: string;
  role: 'assistant' | 'patient' | 'system';
  text: string;
};

type ConversationLogProps = {
  items: ConversationItem[];
};

export function ConversationLog({ items }: ConversationLogProps) {
  return (
    <div className="border-deep-ink/10 rounded-3xl border bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-deep-ink mb-3 font-serif text-base font-semibold sm:mb-4">
        Conversation History
      </h2>
      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed sm:text-sm ${
              item.role === 'assistant'
                ? 'bg-soft-meadow/60 text-deep-ink border-deep-ink/5 border'
                : 'bg-canvas text-deep-ink border-deep-ink/10 border'
            }`}
          >
            <p className="text-slate mb-1 text-[10px] font-medium tracking-[0.2em] uppercase">
              {item.role === 'assistant' ? 'Noa' : 'You'}
            </p>
            <p>{item.text}</p>
          </div>
        ))}
        {items.length === 0 && (
          <div className="border-deep-ink/15 text-slate rounded-2xl border border-dashed p-4 text-center text-xs">
            Speech dialogue will record here automatically.
          </div>
        )}
      </div>
    </div>
  );
}
