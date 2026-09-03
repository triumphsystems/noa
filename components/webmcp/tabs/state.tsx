'use client'

import React, { useState } from 'react'
import { Mic, Square, MessageSquare, Trash2, CheckCircle2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActivityItem } from '../types'

interface StateProps {
  clientState: any
  onExecuteTool: (name: string, input?: any) => Promise<any>
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void
}

export function StateTab({ clientState, onExecuteTool, logActivity }: StateProps) {
  const [copied, setCopied] = useState(false)

  const handleAction = async (toolName: string, input?: any) => {
    try {
      await onExecuteTool(toolName, input)
      logActivity({ type: 'action', target: toolName, status: 'success', input })
    } catch (err: any) {
      logActivity({ type: 'action', target: toolName, status: 'error', output: err?.message })
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(clientState || {}, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5 bg-canvas max-w-4xl mx-auto w-full">
      <div>
        <h3 className="font-serif font-bold text-lg text-deep-ink tracking-tight">Live In-Memory State & Action Deck</h3>
        <p className="text-xs text-slate mt-0.5">
          Direct state snapshot synchronized via{' '}
          <code className="bg-soft-meadow px-1.5 py-0.5 rounded-md font-mono text-xs text-deep-ink">
            document.modelContext.clientState
          </code>.
        </p>
      </div>

      {/* Dashboard Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-soft-meadow p-3.5 rounded-2xl border border-deep-ink/10 shadow-xs">
          <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Active Session</span>
          <span className="font-mono font-bold text-deep-ink truncate block text-xs mt-1">
            {clientState?.activeSessionId || 'None'}
          </span>
        </div>
        <div className="bg-soft-meadow p-3.5 rounded-2xl border border-deep-ink/10 shadow-xs">
          <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Doctor Context</span>
          <span className="font-mono font-bold text-deep-ink truncate block text-xs mt-1">
            {clientState?.doctorId || 'doctor-1'}
          </span>
        </div>
        <div className="bg-soft-meadow p-3.5 rounded-2xl border border-deep-ink/10 shadow-xs">
          <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Voice Stream</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold mt-1">
            {clientState?.isRecording ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-600">Recording</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-moss-green" />
                <span className="text-slate">Standby</span>
              </>
            )}
          </div>
        </div>
        <div className="bg-soft-meadow p-3.5 rounded-2xl border border-deep-ink/10 shadow-xs">
          <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Transcript Buffer</span>
          <span className="font-mono font-bold text-deep-ink block text-xs mt-1">
            {clientState?.transcriptLength ?? 0} chars
          </span>
        </div>
      </div>

      {/* Action Deck Card */}
      <div className="p-4 rounded-2xl bg-soft-meadow/70 border border-deep-ink/10 space-y-2.5">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate block">
          Trigger In-Browser Actions
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('client_start_recording')}
            className="rounded-full text-xs gap-1.5 cursor-pointer bg-canvas hover:bg-soft-meadow border-deep-ink/15 shadow-xs py-1.5 px-3.5 h-auto"
          >
            <Mic className="w-3.5 h-3.5 text-red-500" />
            <span>Start Voice Recording</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('client_stop_recording')}
            className="rounded-full text-xs gap-1.5 cursor-pointer bg-canvas hover:bg-soft-meadow border-deep-ink/15 shadow-xs py-1.5 px-3.5 h-auto"
          >
            <Square className="w-3 h-3 text-deep-ink" />
            <span>Stop Recording</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              handleAction('client_append_transcript', {
                text: `[Clinical Note at ${new Date().toLocaleTimeString()}]: Vitals stable, pulse 72 bpm.`,
              })
            }
            className="rounded-full text-xs gap-1.5 cursor-pointer bg-canvas hover:bg-soft-meadow border-deep-ink/15 shadow-xs py-1.5 px-3.5 h-auto"
          >
            <MessageSquare className="w-3.5 h-3.5 text-moss-green" />
            <span>Append Clinical Finding</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('client_clear_transcript')}
            className="rounded-full text-xs gap-1.5 cursor-pointer bg-canvas hover:bg-soft-meadow border-deep-ink/15 shadow-xs py-1.5 px-3.5 h-auto text-slate hover:text-deep-ink"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Buffer</span>
          </Button>
        </div>
      </div>

      {/* Raw Snapshot Viewer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate">Raw Store State</span>
          <button
            onClick={handleCopy}
            className="text-xs text-slate hover:text-deep-ink hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            {copied ? <CheckCircle2 className="w-3 h-3 text-moss-green" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
        </div>
        <pre className="bg-deep-ink text-[#eff2e5] font-mono text-[11px] p-4 rounded-2xl overflow-auto max-h-72 leading-relaxed shadow-md">
          {JSON.stringify(clientState || {}, null, 2)}
        </pre>
      </div>
    </div>
  )
}
