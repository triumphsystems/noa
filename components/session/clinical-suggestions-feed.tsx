'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Activity } from 'lucide-react';

export interface ClinicalSuggestionItem {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

interface ClinicalSuggestionsFeedProps {
  suggestions: ClinicalSuggestionItem[];
  isGenerating?: boolean;
  className?: string;
}

export function ClinicalSuggestionsFeed({
  suggestions,
  isGenerating,
  className,
}: ClinicalSuggestionsFeedProps) {
  return (
    <Card
      className={`border-deep-ink/8 shadow-editorial border bg-white font-sans ${className || ''}`}
    >
      <CardHeader className="border-deep-ink/5 border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base">
              Real-time Clinical Copilot
            </CardTitle>
          </div>
          {isGenerating ? (
            <span className="animate-pulse rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
              Analyzing dialogue...
            </span>
          ) : suggestions.length > 0 ? (
            <span className="text-slate bg-soft-meadow rounded-full px-2 py-0.5 text-xs">
              {suggestions.length} observation
              {suggestions.length === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="text-slate text-xs">Active Listener</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {suggestions.length === 0 ? (
          <div className="bg-canvas/40 border-deep-ink/10 text-slate space-y-2 rounded-xl border border-dashed p-5 text-center">
            <Activity className="text-slate/40 mx-auto h-5 w-5" />
            <p className="text-deep-ink text-xs font-semibold">
              Awaiting Clinical Dialogue
            </p>
            <p className="text-slate mx-auto max-w-sm text-xs leading-relaxed">
              Nova AI listens to the consultation in real time to suggest
              diagnostic considerations, medication alerts, and follow-up
              prompts.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="bg-soft-meadow/40 border-deep-ink/6 space-y-1.5 rounded-xl border p-3.5"
              >
                <p className="text-deep-ink text-xs leading-relaxed sm:text-sm">
                  {suggestion.text}
                </p>
                <div className="flex justify-end">
                  <Badge
                    variant={
                      suggestion.priority === 'high'
                        ? 'danger'
                        : suggestion.priority === 'medium'
                          ? 'default'
                          : 'secondary'
                    }
                    className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
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
  );
}
