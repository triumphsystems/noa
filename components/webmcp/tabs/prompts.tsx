'use client';

import React, { useState } from 'react';
import { Wand2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PROMPT_PRESETS } from '../constants';
import type { ActivityItem } from '../types';

interface PromptsProps {
  onGetPrompt: (name: string, args: Record<string, string>) => Promise<any>;
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
}

export function PromptsTab({ onGetPrompt, logActivity }: PromptsProps) {
  const [selectedPromptKey, setSelectedPromptKey] = useState<string>(
    'soap-note-generation'
  );
  const [promptArgs, setPromptArgs] = useState<Record<string, string>>(
    PROMPT_PRESETS['soap-note-generation']?.defaultArgs || {}
  );
  const [isEvaluatingPrompt, setIsEvaluatingPrompt] = useState(false);
  const [promptResult, setPromptResult] = useState<any>(null);
  const [promptTimeMs, setPromptTimeMs] = useState<number | null>(null);

  const handleEvaluate = async () => {
    setIsEvaluatingPrompt(true);
    setPromptResult(null);
    const start = performance.now();

    try {
      const result = await onGetPrompt(selectedPromptKey, promptArgs);
      const duration = Math.round(performance.now() - start);
      setPromptTimeMs(duration);
      setPromptResult(result);

      logActivity({
        type: 'prompt',
        target: selectedPromptKey,
        durationMs: duration,
        status: 'success',
        input: promptArgs,
        output: result,
      });
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setPromptTimeMs(duration);
      const errorObj = { error: err?.message || String(err) };
      setPromptResult(errorObj);

      logActivity({
        type: 'prompt',
        target: selectedPromptKey,
        durationMs: duration,
        status: 'error',
        input: promptArgs,
        output: errorObj,
      });
    } finally {
      setIsEvaluatingPrompt(false);
    }
  };

  return (
    <div className="bg-canvas mx-auto w-full max-w-4xl flex-1 space-y-5 overflow-y-auto p-5 font-sans md:p-6">
      {/* Title Header */}
      <div>
        <h3 className="text-deep-ink font-serif text-base font-bold tracking-tight">
          Prompt Templates
        </h3>
        <p className="text-slate mt-0.5 text-xs">
          Evaluate structured prompt templates configured for Nova models with
          live clinical variables.
        </p>
      </div>

      {/* Styled Prompt Picker Card */}
      <div className="border-deep-ink/10 space-y-2 rounded-2xl border bg-white p-4 shadow-2xs">
        <label className="text-deep-ink block text-xs font-medium">
          Select Clinical Prompt Template
        </label>
        <div className="relative">
          <select
            value={selectedPromptKey}
            onChange={(e) => {
              const key = e.target.value;
              setSelectedPromptKey(key);
              setPromptArgs(PROMPT_PRESETS[key]?.defaultArgs || {});
              setPromptResult(null);
            }}
            className="bg-soft-meadow/50 border-deep-ink/10 focus:ring-deep-ink/20 text-deep-ink w-full cursor-pointer appearance-none rounded-lg border px-3.5 py-2 pr-8 font-sans text-xs shadow-2xs focus:ring-1 focus:outline-none"
          >
            {Object.entries(PROMPT_PRESETS).map(([key, def]) => (
              <option key={key} value={key}>
                {def.label} ({key})
              </option>
            ))}
          </select>
          <div className="text-slate/60 pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
            ▼
          </div>
        </div>

        {PROMPT_PRESETS[selectedPromptKey] && (
          <p className="text-slate px-0.5 text-xs leading-relaxed">
            {PROMPT_PRESETS[selectedPromptKey].description}
          </p>
        )}
      </div>

      {/* Variables Card */}
      <div className="border-deep-ink/10 space-y-3 rounded-2xl border bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-deep-ink text-xs font-medium">
            Template Input Arguments
          </span>
          <button
            onClick={() =>
              setPromptArgs(
                PROMPT_PRESETS[selectedPromptKey]?.defaultArgs || {}
              )
            }
            className="text-slate hover:text-deep-ink cursor-pointer text-xs font-medium hover:underline"
          >
            Reset Defaults
          </button>
        </div>

        <div className="space-y-3">
          {Object.keys(promptArgs).map((argKey) => (
            <div key={argKey} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-deep-ink font-mono text-xs font-medium">
                  {argKey}
                </label>
                <span className="text-slate/70 font-mono text-[10px]">
                  string
                </span>
              </div>
              <textarea
                value={promptArgs[argKey] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPromptArgs((prev) => ({ ...prev, [argKey]: val }));
                }}
                rows={
                  argKey === 'transcript' || argKey === 'conversationHistory'
                    ? 4
                    : 2
                }
                className="bg-canvas/60 border-deep-ink/10 focus:ring-deep-ink/20 text-deep-ink w-full resize-y rounded-lg border p-3 font-mono text-xs leading-relaxed shadow-2xs focus:ring-1 focus:outline-none"
              />
            </div>
          ))}
        </div>

        {/* Action Button - Polished CTA */}
        <div className="flex items-center justify-end pt-1">
          <Button
            onClick={handleEvaluate}
            disabled={isEvaluatingPrompt}
            className="bg-hi-yellow text-deep-ink border-deep-ink/10 h-auto cursor-pointer gap-2 rounded-full border px-5 py-1.5 text-xs font-semibold shadow-2xs transition-transform hover:bg-[#ebd020] active:scale-95"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>
              {isEvaluatingPrompt
                ? 'Evaluating Prompt...'
                : 'Evaluate Prompt Template'}
            </span>
          </Button>
        </div>
      </div>

      {/* Evaluated Messages Preview */}
      {promptResult && (
        <div className="border-deep-ink/10 space-y-2.5 border-t pt-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-deep-ink text-xs font-medium">
                Evaluated Messages Payload
              </span>
              {promptTimeMs !== null && (
                <span className="border-deep-ink/10 text-slate rounded-md border bg-white px-2 py-0.5 font-mono text-[11px]">
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
                  className={`space-y-1 rounded-xl border p-3.5 text-xs leading-relaxed shadow-2xs ${
                    msg.role === 'system'
                      ? 'bg-soft-meadow/50 border-deep-ink/10 text-deep-ink'
                      : msg.role === 'assistant'
                        ? 'bg-hi-yellow/10 border-hi-yellow/30 text-deep-ink'
                        : 'border-deep-ink/10 text-deep-ink bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate/80 font-mono text-[10px] font-semibold tracking-wider uppercase">
                      Role: {msg.role}
                    </span>
                  </div>
                  <p className="text-deep-ink font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {msg.content?.text || JSON.stringify(msg.content)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <pre className="bg-deep-ink max-h-72 overflow-auto rounded-xl p-4 font-mono text-xs leading-relaxed text-white shadow-sm">
              {JSON.stringify(promptResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
