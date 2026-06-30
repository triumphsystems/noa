interface ClinicalSuggestion {
  text: string
  priority: 'high' | 'medium' | 'low'
}

interface SessionSuggestionsProps {
  suggestions: ClinicalSuggestion[]
}

const priorityStyles: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

export function SessionSuggestions({ suggestions }: SessionSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-moss-green/10 to-fuchsia/10 rounded-3xl p-6 border border-deep-ink/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-moss-green rounded-full animate-pulse" />
        <h3 className="text-lg font-semibold font-serif">Nova AI Suggestions</h3>
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-3 border-l-4 border-moss-green">
            <p className="text-sm text-deep-ink">{suggestion.text}</p>
            <span
              className={`inline-block text-xs font-medium mt-2 px-2 py-1 rounded-full ${
                priorityStyles[suggestion.priority] || priorityStyles.low
              }`}
            >
              {suggestion.priority} priority
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
