'use client'

import React from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActivityItem } from '../types'

interface ActivityProps {
  activityLog: ActivityItem[]
  onClearLog: () => void
}

export function ActivityTab({ activityLog, onClearLog }: ActivityProps) {
  return (
    <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5 bg-canvas max-w-4xl mx-auto w-full font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-base text-deep-ink tracking-tight">Activity Log</h3>
          <p className="text-xs text-slate mt-0.5">
            Real-time telemetry of tool calls, resource reads, and prompt evaluations during this session.
          </p>
        </div>
        {activityLog.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearLog}
            className="text-xs text-slate hover:text-rose-600 rounded-lg cursor-pointer px-2.5 py-1 h-auto"
          >
            Clear History
          </Button>
        )}
      </div>

      {activityLog.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate text-xs space-y-2">
          <Clock className="w-8 h-8 text-slate/30 mb-1" />
          <p className="font-serif font-bold text-sm text-deep-ink">No Activity Recorded</p>
          <p className="text-xs max-w-xs leading-relaxed">
            Invocations from the Tools playground or Resource explorer will stream live execution logs here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activityLog.map(item => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-white border border-deep-ink/10 text-xs space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                      item.status === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="font-mono font-medium text-deep-ink text-xs">{item.target}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate/70 font-mono">
                  {item.durationMs !== undefined && (
                    <span className="bg-canvas px-1.5 py-0.2 rounded border border-deep-ink/5">
                      {item.durationMs}ms
                    </span>
                  )}
                  <span>{item.timestamp}</span>
                </div>
              </div>

              {item.output && (
                <pre className="bg-deep-ink text-[#eff2e5] p-3 rounded-lg border border-deep-ink/5 text-xs font-mono overflow-x-auto max-h-36 leading-relaxed">
                  {JSON.stringify(item.output, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
