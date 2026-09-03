'use client'

import React, { useState } from 'react'
import { Wand2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5 bg-canvas max-w-4xl mx-auto w-full font-sans">
      {/* Title Header */}
      <div>
        <h3 className="font-serif font-bold text-base text-deep-ink tracking-tight">Prompt Templates</h3>
        <p className="text-xs text-slate mt-0.5">
          Evaluate structured prompt templates configured for Nova models with live clinical variables.
        </p>
      </div>

      {/* Styled Prompt Picker Card */}
      <div className="p-4 rounded-2xl bg-white border border-deep-ink/10 space-y-2 shadow-2xs">
        <label className="text-xs font-medium text-deep-ink block">
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
            className="w-full px-3.5 py-2 text-xs bg-soft-meadow/50 border border-deep-ink/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-deep-ink/20 font-sans text-deep-ink cursor-pointer shadow-2xs appearance-none pr-8"
          >
            {Object.entries(PROMPT_PRESETS).map(([key, def]) => (
              <option key={key} value={key}>
                {def.label} ({key})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate/60 text-xs">▼</div>
        </div>

        {PROMPT_PRESETS[selectedPromptKey] && (
          <p className="text-xs text-slate px-0.5 leading-relaxed">{PROMPT_PRESETS[selectedPromptKey].description}</p>
        )}
      </div>

      {/* Variables Card */}
      <div className="p-4 rounded-2xl bg-white border border-deep-ink/10 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-deep-ink">Template Input Arguments</span>
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
                <label className="text-xs font-mono font-medium text-deep-ink">{argKey}</label>
                <span className="text-[10px] text-slate/70 font-mono">string</span>
              </div>
              <textarea
                value={promptArgs[argKey] || ''}
                onChange={e => {
                  const val = e.target.value
                  setPromptArgs(prev => ({ ...prev, [argKey]: val }))
                }}
                rows={argKey === 'transcript' || argKey === 'conversationHistory' ? 4 : 2}
                className="w-full font-mono text-xs p-3 bg-canvas/60 border border-deep-ink/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-deep-ink/20 leading-relaxed text-deep-ink resize-y shadow-2xs"
              />
            </div>
          ))}
        </div>

        {/* Action Button - Polished CTA */}
        <div className="flex items-center justify-end pt-1">
          <Button
            onClick={handleEvaluate}
            disabled={isEvaluatingPrompt}
            className="rounded-full bg-hi-yellow hover:bg-[#ebd020] text-deep-ink text-xs font-semibold gap-2 px-5 py-1.5 shadow-2xs cursor-pointer transition-transform active:scale-95 border border-deep-ink/10 h-auto"
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
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium text-deep-ink text-xs">Evaluated Messages Payload</span>
              {promptTimeMs !== null && (
                <span className="text-[11px] font-mono border border-deep-ink/10 bg-white px-2 py-0.5 rounded-md text-slate">
                  {promptTimeMs} ms
                </span>
              )}
            </div>
          </div>

          {promptResult.messages && Array.isArray(promptResult.messages) ? (
            <div className="space-y-2">
              {promptResult.messages.map((msg: any, i: number) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 shadow-2xs ${
                    msg.role === 'system'
                      ? 'bg-soft-meadow/50 border-deep-ink/10 text-deep-ink'
                      : msg.role === 'assistant'
                      ? 'bg-hi-yellow/10 border-hi-yellow/30 text-deep-ink'
                      : 'bg-white border-deep-ink/10 text-deep-ink'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-[10px] uppercase tracking-wider text-slate/80">
                      Role: {msg.role}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap font-mono text-xs text-deep-ink leading-relaxed">
                    {msg.content?.text || JSON.stringify(msg.content)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <pre className="bg-deep-ink text-white font-mono text-xs p-4 rounded-xl overflow-auto max-h-72 leading-relaxed shadow-sm">
              {JSON.stringify(promptResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
