'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

export interface ClinicalSuggestionItem {
  text: string
  priority: 'high' | 'medium' | 'low'
}

interface ClinicalSuggestionsFeedProps {
  suggestions: ClinicalSuggestionItem[]
  isGenerating?: boolean
  className?: string
}

export function ClinicalSuggestionsFeed({
  suggestions,
  isGenerating,
  className,
}: ClinicalSuggestionsFeedProps) {
  if (suggestions.length === 0 && !isGenerating) {
    return null
  }

  return (
    <Card className={`border border-deep-ink/8 bg-white shadow-editorial font-sans ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-hi-yellow" />
          <CardTitle className="text-base">Clinical Guidance</CardTitle>
          {isGenerating && (
            <span className="text-xs text-slate animate-pulse ml-auto">Analyzing...</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className="bg-soft-meadow/40 rounded-xl p-3 border border-deep-ink/6 space-y-1.5"
          >
            <p className="text-xs text-deep-ink leading-relaxed">{suggestion.text}</p>
            <div className="flex justify-end">
              <Badge
                variant={
                  suggestion.priority === 'high'
                    ? 'danger'
                    : suggestion.priority === 'medium'
                      ? 'default'
                      : 'secondary'
                }
                className="text-[10px] font-medium uppercase"
              >
                {suggestion.priority}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
