'use client';

import React, { useState } from 'react';
import {
  Mic,
  Square,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActivityItem } from '../types';

interface StateProps {
  clientState: any;
  onExecuteTool: (name: string, input?: any) => Promise<any>;
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
}

export function StateTab({
  clientState,
  onExecuteTool,
  logActivity,
}: StateProps) {
  const [copied, setCopied] = useState(false);

  const handleAction = async (toolName: string, input?: any) => {
    try {
      await onExecuteTool(toolName, input);
      logActivity({
        type: 'action',
        target: toolName,
        status: 'success',
        input,
      });
    } catch (err: any) {
      logActivity({
        type: 'action',
        target: toolName,
        status: 'error',
        output: err?.message,
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(clientState || {}, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-canvas mx-auto w-full max-w-4xl flex-1 space-y-5 overflow-y-auto p-5 font-sans md:p-6">
      <div>
        <h3 className="text-deep-ink font-serif text-base font-bold tracking-tight">
          Client State & Telemetry
        </h3>
        <p className="text-slate mt-0.5 text-xs">
          Live snapshot synchronized via{' '}
          <code className="bg-soft-meadow text-deep-ink rounded px-1.5 py-0.5 font-mono text-xs">
            document.modelContext.clientState
          </code>
          .
        </p>
      </div>

      {/* Dashboard Stat Tiles */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="border-deep-ink/10 rounded-xl border bg-white p-3.5 shadow-2xs">
          <span className="text-slate block text-xs font-medium">
            Active Session
          </span>
          <span className="text-deep-ink mt-1 block truncate font-mono text-xs font-medium">
            {clientState?.activeSessionId || 'None'}
          </span>
        </div>
        <div className="border-deep-ink/10 rounded-xl border bg-white p-3.5 shadow-2xs">
          <span className="text-slate block text-xs font-medium">
            Doctor Context
          </span>
          <span className="text-deep-ink mt-1 block truncate font-mono text-xs font-medium">
            {clientState?.doctorId || 'doctor-1'}
          </span>
        </div>
        <div className="border-deep-ink/10 rounded-xl border bg-white p-3.5 shadow-2xs">
          <span className="text-slate block text-xs font-medium">
            Voice Stream
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium">
            {clientState?.isRecording ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                <span className="text-rose-600">Recording</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate">Standby</span>
              </>
            )}
          </div>
        </div>
        <div className="border-deep-ink/10 rounded-xl border bg-white p-3.5 shadow-2xs">
          <span className="text-slate block text-xs font-medium">
            Transcript Buffer
          </span>
          <span className="text-deep-ink mt-1 block font-mono text-xs font-medium">
            {clientState?.transcriptLength ?? 0} chars
          </span>
        </div>
      </div>

      {/* Action Deck Card */}
      <div className="border-deep-ink/10 space-y-2.5 rounded-2xl border bg-white p-4 shadow-2xs">
        <span className="text-deep-ink block text-xs font-medium">
          Trigger In-Browser Actions
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('client_start_recording')}
            className="bg-canvas hover:bg-soft-meadow border-deep-ink/10 h-auto cursor-pointer gap-1.5 rounded-full px-3 py-1.5 text-xs shadow-2xs"
          >
            <Mic className="h-3.5 w-3.5 text-rose-500" />
            <span>Start Voice Recording</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('client_stop_recording')}
            className="bg-canvas hover:bg-soft-meadow border-deep-ink/10 h-auto cursor-pointer gap-1.5 rounded-full px-3 py-1.5 text-xs shadow-2xs"
          >
            <Square className="text-deep-ink h-3 w-3" />
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
            className="bg-canvas hover:bg-soft-meadow border-deep-ink/10 h-auto cursor-pointer gap-1.5 rounded-full px-3 py-1.5 text-xs shadow-2xs"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
            <span>Append Clinical Finding</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('client_clear_transcript')}
            className="bg-canvas hover:bg-soft-meadow border-deep-ink/10 text-slate hover:text-deep-ink h-auto cursor-pointer gap-1.5 rounded-full px-3 py-1.5 text-xs shadow-2xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Buffer</span>
          </Button>
        </div>
      </div>

      {/* Raw Snapshot Viewer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-deep-ink text-xs font-medium">
            Raw Store State
          </span>
          <button
            onClick={handleCopy}
            className="text-slate hover:text-deep-ink flex cursor-pointer items-center gap-1 text-xs font-medium hover:underline"
          >
            {copied ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
        </div>
        <pre className="bg-deep-ink max-h-72 overflow-auto rounded-xl p-4 font-mono text-xs leading-relaxed text-[#eff2e5] shadow-sm">
          {JSON.stringify(clientState || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
