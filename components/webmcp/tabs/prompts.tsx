'use client'

import React, { useState } from 'react'
import { Wand2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PROMPT_PRESETS } from '../constants'
import type { ActivityItem } from '../types'

interface PromptsProps {
  onGetPrompt: (name: string, args: Record<string, string>) => Promise<any>
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void
}

export function PromptsTab({ onGetPrompt, logActivity }: PromptsProps) {
  const [selectedPromptKey, setSelectedPromptKey] = useState<string>('soap-note-generation')
  const [promptArgs, setPromptArgs] = useState<Record<string, string>>(
    PROMPT_PRESETS['soap-note-generation']?.defaultArgs || {}
  )
  const [isEvaluatingPrompt, setIsEvaluatingPrompt] = useState(false)
  const [promptResult, setPromptResult] = useState<any>(null)
  const [promptTimeMs, setPromptTimeMs] = useState<number | null>(null)

  const handleEvaluate = async () => {
    setIsEvaluatingPrompt(true)
    setPromptResult(null)
    const start = performance.now()

    try {
      const result = await onGetPrompt(selectedPromptKey, promptArgs)
      const duration = Math.round(performance.now() - start)
      setPromptTimeMs(duration)
      setPromptResult(result)

      logActivity({
        type: 'prompt',
        target: selectedPromptKey,
        durationMs: duration,
        status: 'success',
        input: promptArgs,
        output: result,
      })
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      setPromptTimeMs(duration)
      const errorObj = { error: err?.message || String(err) }
      setPromptResult(errorObj)

      logActivity({
        type: 'prompt',
        target: selectedPromptKey,
        durationMs: duration,
        status: 'error',
        input: promptArgs,
        output: errorObj,
      })
    } finally {
      setIsEvaluatingPrompt(false)
    }
  }

  return (
    <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5 bg-canvas max-w-4xl mx-auto w-full">
      {/* Title Header */}
      <div>
        <h3 className="font-serif font-bold text-lg text-deep-ink tracking-tight">Clinical Prompt Templates</h3>
        <p className="text-xs text-slate mt-0.5">
          Evaluate structured prompt templates configured for Nova models with live clinical variables.
        </p>
      </div>

      {/* Styled Prompt Picker Card */}
      <div className="p-4 rounded-2xl bg-soft-meadow/70 border border-deep-ink/10 space-y-2.5">
        <label className="text-[10px] uppercase tracking-wider font-bold text-slate block">
          Select Clinical Prompt Template
        </label>
        <div className="relative">
          <select
            value={selectedPromptKey}
            onChange={e => {
              const key = e.target.value
              setSelectedPromptKey(key)
              setPromptArgs(PROMPT_PRESETS[key]?.defaultArgs || {})
              setPromptResult(null)
            }}
            className="w-full px-3.5 py-2.5 text-xs bg-canvas border border-deep-ink/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-ink/15 font-serif font-semibold text-deep-ink cursor-pointer shadow-xs appearance-none pr-9"
          >
            {Object.entries(PROMPT_PRESETS).map(([key, def]) => (
              <option key={key} value={key}>
                {def.label} ({key})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate text-xs">▼</div>
        </div>

        {PROMPT_PRESETS[selectedPromptKey] && (
          <p className="text-xs text-slate px-1 leading-relaxed">{PROMPT_PRESETS[selectedPromptKey].description}</p>
        )}
      </div>

      {/* Variables Card */}
      <div className="p-4 rounded-2xl bg-soft-meadow/50 border border-deep-ink/10 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate">Template Input Arguments</span>
          <button
            onClick={() => setPromptArgs(PROMPT_PRESETS[selectedPromptKey]?.defaultArgs || {})}
            className="text-xs text-slate hover:text-deep-ink hover:underline font-medium cursor-pointer"
          >
            Reset Defaults
          </button>
        </div>

        <div className="space-y-3">
          {Object.keys(promptArgs).map(argKey => (
            <div key={argKey} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-deep-ink">{argKey}</label>
                <span className="text-[9px] text-slate font-mono uppercase">string</span>
              </div>
              <textarea
                value={promptArgs[argKey] || ''}
                onChange={e => {
                  const val = e.target.value
                  setPromptArgs(prev => ({ ...prev, [argKey]: val }))
                }}
                rows={argKey === 'transcript' || argKey === 'conversationHistory' ? 4 : 2}
                className="w-full font-mono text-xs p-3 bg-canvas border border-deep-ink/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-ink/15 leading-relaxed text-deep-ink resize-y shadow-xs"
              />
            </div>
          ))}
        </div>

        {/* Action Button - Polished CTA */}
        <div className="flex items-center justify-end pt-1">
          <Button
            onClick={handleEvaluate}
            disabled={isEvaluatingPrompt}
            className="rounded-full bg-hi-yellow hover:bg-[#ebd020] text-deep-ink text-xs font-bold gap-2 px-6 py-2 shadow-xs cursor-pointer transition-transform active:scale-95 border border-deep-ink/10 h-auto"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isEvaluatingPrompt ? 'Evaluating Prompt...' : 'Evaluate Prompt Template'}</span>
          </Button>
        </div>
      </div>

      {/* Evaluated Messages Preview */}
      {promptResult && (
        <div className="space-y-2.5 pt-3 border-t border-deep-ink/10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-moss-green" />
              <span className="font-serif font-bold text-sm text-deep-ink">Evaluated Messages Payload</span>
              {promptTimeMs !== null && (
                <Badge variant="outline" className="text-[10px] font-mono border-deep-ink/10 bg-soft-meadow">
                  {promptTimeMs} ms
                </Badge>
              )}
            </div>
          </div>

          {promptResult.messages && Array.isArray(promptResult.messages) ? (
            <div className="space-y-2.5">
              {promptResult.messages.map((msg: any, i: number) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 shadow-xs ${
                    msg.role === 'system'
                      ? 'bg-soft-meadow/80 border-deep-ink/10 text-deep-ink'
                      : msg.role === 'assistant'
                      ? 'bg-hi-yellow/15 border-hi-yellow/40 text-deep-ink'
                      : 'bg-canvas border-deep-ink/10 text-deep-ink'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate">
                      Role: {msg.role}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap font-mono text-[11px] text-deep-ink leading-relaxed">
                    {msg.content?.text || JSON.stringify(msg.content)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <pre className="bg-deep-ink text-white font-mono text-[11px] p-4 rounded-2xl overflow-auto max-h-72 leading-relaxed shadow-md">
              {JSON.stringify(promptResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
