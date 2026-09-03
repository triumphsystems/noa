'use client'

import React from 'react'
import { Mic, Square, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActivityItem } from '../types'

interface StateTabProps {
  clientState: any
  onExecuteTool: (name: string, input?: any) => Promise<any>
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void
}

export function StateTab({ clientState, onExecuteTool, logActivity }: StateTabProps) {
  const handleAction = async (toolName: string, input?: any) => {
    try {
      await onExecuteTool(toolName, input)
      logActivity({ type: 'action', target: toolName, status: 'success', input })
    } catch (err: any) {
      logActivity({ type: 'action', target: toolName, status: 'error', output: err?.message })
    }
  }

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-white">
      <div>
        <h3 className="font-serif font-bold text-sm text-deep-ink">Live In-Memory State & Action Deck</h3>
        <p className="text-xs text-slate mt-0.5">
          Direct state snapshot synchronized via{' '}
          <code className="bg-soft-meadow px-1 py-0.5 rounded font-mono">document.modelContext.clientState</code>.
        </p>
      </div>

      {/* Quick Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-canvas p-3 rounded-2xl border border-deep-ink/10 text-xs">
          <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Session</span>
          <span className="font-mono font-bold text-deep-ink truncate block text-[11px] mt-0.5">
            {clientState?.activeSessionId || 'None'}
          </span>
        </div>
        <div className="bg-canvas p-3 rounded-2xl border border-deep-ink/10 text-xs">
          <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Doctor</span>
          <span className="font-mono font-bold text-deep-ink truncate block text-[11px] mt-0.5">
            {clientState?.doctorId || 'doctor-1'}
          </span>
        </div>
        <div className="bg-canvas p-3 rounded-2xl border border-deep-ink/10 text-xs">
          <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Recording</span>
          <span className="font-bold flex items-center gap-1 text-[11px] mt-0.5">
            {clientState?.isRecording ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-600">Active</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-moss-green" />
                <span className="text-slate">Standby</span>
              </>
            )}
          </span>
        </div>
        <div className="bg-canvas p-3 rounded-2xl border border-deep-ink/10 text-xs">
          <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Transcript</span>
          <span className="font-mono font-bold text-deep-ink block text-[11px] mt-0.5">
            {clientState?.transcriptLength ?? 0} chars
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="space-y-2 bg-canvas/40 p-4 rounded-2xl border border-deep-ink/10">
        <span className="text-xs font-bold text-deep-ink block">Execute Browser Actions Directly:</span>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('client_start_recording')}
            className="rounded-full text-xs gap-1 cursor-pointer bg-white hover:bg-soft-meadow"
          >
            <Mic className="w-3.5 h-3.5 text-red-500" />
            <span>Start Recording</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('client_stop_recording')}
            className="rounded-full text-xs gap-1 cursor-pointer bg-white hover:bg-soft-meadow"
          >
            <Square className="w-3 h-3 text-deep-ink" />
            <span>Stop Recording</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              handleAction('client_append_transcript', {
                text: `[Clinical Note at ${new Date().toLocaleTimeString()}]: Vitals stable.`,
              })
            }
            className="rounded-full text-xs gap-1 cursor-pointer bg-white hover:bg-soft-meadow"
          >
            <MessageSquare className="w-3.5 h-3.5 text-moss-green" />
            <span>Append Finding</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('client_clear_transcript')}
            className="rounded-full text-xs gap-1 cursor-pointer bg-white hover:bg-soft-meadow text-slate"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Buffer</span>
          </Button>
        </div>
      </div>

      {/* State Inspector Tree */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate font-bold">Raw Store Snapshot</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(clientState || {}, null, 2))
            }}
            className="text-[10px] text-slate hover:text-deep-ink hover:underline cursor-pointer"
          >
            Copy JSON
          </button>
        </div>
        <pre className="bg-canvas border border-deep-ink/10 text-deep-ink font-mono text-xs p-4 rounded-2xl overflow-auto leading-relaxed max-h-80">
          {JSON.stringify(clientState || {}, null, 2)}
        </pre>
      </div>
    </div>
  )
}
