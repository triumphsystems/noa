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
    <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5 bg-canvas max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-lg text-deep-ink tracking-tight">WebMCP Activity Log</h3>
          <p className="text-xs text-slate mt-0.5">
            Real-time telemetry of tool calls, resource reads, and prompt evaluations during this session.
          </p>
        </div>
        {activityLog.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearLog}
            className="text-xs text-slate hover:text-red-600 rounded-full cursor-pointer px-3 py-1 h-auto"
          >
            Clear History
          </Button>
        )}
      </div>

      {activityLog.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate text-xs space-y-2">
          <Clock className="w-8 h-8 text-slate/30 mb-1" />
          <p className="font-serif font-bold text-sm text-deep-ink">No Activity Recorded Yet</p>
          <p className="text-xs max-w-xs leading-relaxed">
            Invocations from the Tools playground or Resource explorer will stream live execution logs here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activityLog.map(item => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-soft-meadow border border-deep-ink/10 text-xs space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      item.status === 'success' ? 'bg-moss-green/20 text-deep-ink' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="font-mono font-bold text-deep-ink text-xs">{item.target}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate font-mono">
                  {item.durationMs !== undefined && (
                    <span className="bg-canvas px-1.5 py-0.5 rounded-md border border-deep-ink/5">
                      {item.durationMs}ms
                    </span>
                  )}
                  <span>{item.timestamp}</span>
                </div>
              </div>

              {item.output && (
                <pre className="bg-deep-ink text-[#eff2e5] p-3 rounded-xl border border-deep-ink/5 text-[10px] font-mono overflow-x-auto max-h-36 leading-relaxed shadow-inner">
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
