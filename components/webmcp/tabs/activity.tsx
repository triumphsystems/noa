'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActivityItem } from '../types';

interface ActivityProps {
  activityLog: ActivityItem[];
  onClearLog: () => void;
}

export function ActivityTab({ activityLog, onClearLog }: ActivityProps) {
  return (
    <div className="bg-canvas mx-auto w-full max-w-4xl flex-1 space-y-5 overflow-y-auto p-5 font-sans md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-deep-ink font-serif text-base font-bold tracking-tight">
            Activity Log
          </h3>
          <p className="text-slate mt-0.5 text-xs">
            Real-time telemetry of tool calls, resource reads, and prompt
            evaluations during this session.
          </p>
        </div>
        {activityLog.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearLog}
            className="text-slate h-auto cursor-pointer rounded-lg px-2.5 py-1 text-xs hover:text-rose-600"
          >
            Clear History
          </Button>
        )}
      </div>

      {activityLog.length === 0 ? (
        <div className="text-slate flex flex-col items-center justify-center space-y-2 p-12 text-center text-xs">
          <Clock className="text-slate/30 mb-1 h-8 w-8" />
          <p className="text-deep-ink font-serif text-sm font-bold">
            No Activity Recorded
          </p>
          <p className="max-w-xs text-xs leading-relaxed">
            Invocations from the Tools playground or Resource explorer will
            stream live execution logs here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activityLog.map((item) => (
            <div
              key={item.id}
              className="border-deep-ink/10 space-y-2 rounded-xl border bg-white p-3.5 text-xs shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`py-0.2 rounded-md px-1.5 font-mono text-[10px] ${
                      item.status === 'success'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="text-deep-ink font-mono text-xs font-medium">
                    {item.target}
                  </span>
                </div>

                <div className="text-slate/70 flex items-center gap-2 font-mono text-[11px]">
                  {item.durationMs !== undefined && (
                    <span className="bg-canvas py-0.2 border-deep-ink/5 rounded border px-1.5">
                      {item.durationMs}ms
                    </span>
                  )}
                  <span>{item.timestamp}</span>
                </div>
              </div>

              {item.output && (
                <pre className="bg-deep-ink border-deep-ink/5 max-h-36 overflow-x-auto rounded-lg border p-3 font-mono text-xs leading-relaxed text-[#eff2e5]">
                  {JSON.stringify(item.output, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
