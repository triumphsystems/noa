'use client'

import React, { useState } from 'react'
import { Wand2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PROMPT_PRESETS } from '../constants'
import type { ActivityItem } from '../types'

interface PromptsTabProps {
  onGetPrompt: (name: string, args: Record<string, string>) => Promise<any>
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void
}

export function PromptsTab({ onGetPrompt, logActivity }: PromptsTabProps) {
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
    <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-white">
      <div>
        <h3 className="font-serif font-bold text-sm text-deep-ink">Clinical Prompt Templates</h3>
        <p className="text-xs text-slate mt-0.5">
          Evaluate prompt templates configured for Nova AI models with live clinical variables.
        </p>
      </div>

      {/* Prompt Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-deep-ink block">Select Clinical Prompt</label>
        <select
          value={selectedPromptKey}
          onChange={e => {
            const key = e.target.value
            setSelectedPromptKey(key)
            setPromptArgs(PROMPT_PRESETS[key]?.defaultArgs || {})
            setPromptResult(null)
          }}
          className="w-full px-3.5 py-2 text-xs bg-canvas/30 border border-deep-ink/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-hi-yellow font-mono text-deep-ink cursor-pointer"
        >
          {Object.entries(PROMPT_PRESETS).map(([key, def]) => (
            <option key={key} value={key}>
              {key} — {def.label}
            </option>
          ))}
        </select>
        {PROMPT_PRESETS[selectedPromptKey] && (
          <p className="text-xs text-slate">{PROMPT_PRESETS[selectedPromptKey].description}</p>
        )}
      </div>

      {/* Prompt Variables Form */}
      <div className="space-y-3 bg-canvas/40 p-4 rounded-2xl border border-deep-ink/10">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-wider font-bold text-slate">Prompt Arguments</label>
          <button
            onClick={() => setPromptArgs(PROMPT_PRESETS[selectedPromptKey]?.defaultArgs || {})}
            className="text-[10px] text-slate hover:text-deep-ink hover:underline cursor-pointer"
          >
            Reset Defaults
          </button>
        </div>

        {Object.keys(promptArgs).map(argKey => (
          <div key={argKey} className="space-y-1">
            <label className="text-xs font-mono font-semibold text-deep-ink">{argKey}</label>
            <textarea
              value={promptArgs[argKey] || ''}
              onChange={e => {
                const val = e.target.value
                setPromptArgs(prev => ({ ...prev, [argKey]: val }))
              }}
              rows={argKey === 'transcript' || argKey === 'conversationHistory' ? 4 : 2}
              className="w-full font-mono text-xs p-2.5 bg-white border border-deep-ink/15 rounded-xl focus:outline-none focus:ring-1 focus:ring-hi-yellow resize-none"
            />
          </div>
        ))}

        <Button
          onClick={handleEvaluate}
          disabled={isEvaluatingPrompt}
          className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-bold py-2 shadow-xs cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5 mr-1" />
          {isEvaluatingPrompt ? 'Evaluating Prompt...' : 'Evaluate Prompt Template'}
        </Button>
      </div>

      {/* Evaluated Messages Display */}
      {promptResult && (
        <div className="space-y-2 pt-2 border-t border-deep-ink/10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-moss-green" />
              <span className="font-bold text-deep-ink">Evaluated Messages</span>
              {promptTimeMs !== null && (
                <Badge variant="outline" className="text-[10px] font-mono">
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
                  className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                    msg.role === 'system'
                      ? 'bg-soft-meadow/50 border-deep-ink/15 text-deep-ink'
                      : msg.role === 'assistant'
                      ? 'bg-hi-yellow/15 border-hi-yellow/40 text-deep-ink'
                      : 'bg-white border-deep-ink/10 text-deep-ink'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[10px] uppercase tracking-wider">
                      Role: {msg.role}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap font-mono text-[11px] text-slate">
                    {msg.content?.text || JSON.stringify(msg.content)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <pre className="bg-deep-ink text-white font-mono text-[11px] p-3.5 rounded-2xl overflow-auto max-h-72 leading-relaxed">
              {JSON.stringify(promptResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
