'use client'

import React from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActivityItem } from '../types'

interface ActivityTabProps {
  activityLog: ActivityItem[]
  onClearLog: () => void
}

export function ActivityTab({ activityLog, onClearLog }: ActivityTabProps) {
  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-sm text-deep-ink">WebMCP Session Activity</h3>
          <p className="text-xs text-slate mt-0.5">
            Chronological stream of tool invocations, resource reads, and prompt evaluations.
          </p>
        </div>
        {activityLog.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearLog}
            className="text-xs text-slate hover:text-red-600 cursor-pointer"
          >
            Clear Log
          </Button>
        )}
      </div>

      {activityLog.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate text-xs space-y-2">
          <Clock className="w-8 h-8 text-slate/30" />
          <p className="font-semibold text-deep-ink">No activity yet</p>
          <p className="text-[11px] max-w-xs">
            Execute tools or read resources from the playground to see live execution telemetry recorded here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activityLog.map(item => (
            <div key={item.id} className="p-3 rounded-2xl bg-canvas border border-deep-ink/5 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      item.status === 'success' ? 'bg-moss-green/20 text-deep-ink' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="font-mono font-bold text-deep-ink text-[11px]">{item.target}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate font-mono">
                  {item.durationMs !== undefined && <span>{item.durationMs}ms</span>}
                  <span>{item.timestamp}</span>
                </div>
              </div>

              {item.output && (
                <pre className="bg-white p-2.5 rounded-xl border border-deep-ink/5 text-[10px] font-mono text-slate overflow-x-auto max-h-32">
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
