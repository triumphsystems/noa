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
    <Card className={`border-moss-green/30 bg-gradient-to-br from-moss-green/10 via-soft-meadow to-white ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-moss-green animate-pulse" />
          <CardTitle className="text-lg">Nova AI Clinical Guidance</CardTitle>
          {isGenerating && (
            <span className="text-xs text-slate animate-pulse ml-auto">Analyzing...</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-3 border border-deep-ink/10 shadow-2xs space-y-1.5"
          >
            <p className="text-sm text-deep-ink leading-snug">{suggestion.text}</p>
            <div className="flex justify-end">
              <Badge
                variant={
                  suggestion.priority === 'high'
                    ? 'danger'
                    : suggestion.priority === 'medium'
                      ? 'default'
                      : 'secondary'
                }
                className="text-[10px] font-semibold uppercase"
              >
                {suggestion.priority} priority
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
