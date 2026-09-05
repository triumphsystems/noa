'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Activity } from 'lucide-react'

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
  return (
    <Card className={`border border-deep-ink/8 bg-white shadow-editorial font-sans ${className || ''}`}>
      <CardHeader className="pb-3 border-b border-deep-ink/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base">Real-time Clinical Copilot</CardTitle>
          </div>
          {isGenerating ? (
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
              Analyzing dialogue...
            </span>
          ) : suggestions.length > 0 ? (
            <span className="text-xs text-slate bg-soft-meadow px-2 py-0.5 rounded-full">
              {suggestions.length} observation{suggestions.length === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="text-xs text-slate">Active Listener</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {suggestions.length === 0 ? (
          <div className="p-5 text-center bg-canvas/40 rounded-xl border border-dashed border-deep-ink/10 text-slate space-y-2">
            <Activity className="h-5 w-5 text-slate/40 mx-auto" />
            <p className="text-xs font-semibold text-deep-ink">Awaiting Clinical Dialogue</p>
            <p className="text-xs text-slate max-w-sm mx-auto leading-relaxed">
              Nova AI listens to the consultation in real time to suggest diagnostic considerations, medication alerts, and follow-up prompts.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="bg-soft-meadow/40 rounded-xl p-3.5 border border-deep-ink/6 space-y-1.5"
              >
                <p className="text-xs sm:text-sm text-deep-ink leading-relaxed">{suggestion.text}</p>
                <div className="flex justify-end">
                  <Badge
                    variant={
                      suggestion.priority === 'high'
                        ? 'danger'
                        : suggestion.priority === 'medium'
                          ? 'default'
                          : 'secondary'
                    }
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
                  >
                    {suggestion.priority} priority
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
