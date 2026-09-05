'use client';

import React from 'react';
import { Sparkles, RefreshCw, Maximize2, Minimize2, X } from 'lucide-react';

interface InspectorHeaderProps {
  isExpanded: boolean;
  isSyncing: boolean;
  onToggleExpand: () => void;
  onRefresh: () => void;
  onClose: () => void;
}

export function InspectorHeader({
  isExpanded,
  isSyncing,
  onToggleExpand,
  onRefresh,
  onClose,
}: InspectorHeaderProps) {
  return (
    <div className="border-deep-ink/10 bg-canvas flex shrink-0 items-center justify-between gap-3 border-b px-5 py-3">
      {/* Left: Brand & Runtime Context */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="bg-deep-ink text-hi-yellow flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-deep-ink font-serif text-sm leading-none font-bold tracking-tight whitespace-nowrap">
              WebMCP Studio
            </h2>
            <div className="text-slate bg-soft-meadow border-deep-ink/5 flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Ready</span>
            </div>
          </div>
          <p className="text-slate mt-0.5 truncate font-mono text-[11px] leading-tight">
            document.modelContext <span className="text-slate/40">•</span>{' '}
            /api/mcp
          </p>
        </div>
      </div>

      {/* Right: Window Controls */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          className="text-slate hover:text-deep-ink hover:bg-soft-meadow cursor-pointer rounded-lg p-1.5 transition-colors"
          title="Sync definitions from server"
          aria-label="Refresh tools"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isSyncing ? 'text-deep-ink animate-spin' : ''}`}
          />
        </button>

        <button
          onClick={onToggleExpand}
          className="text-slate hover:text-deep-ink hover:bg-soft-meadow cursor-pointer rounded-lg p-1.5 transition-colors"
          title={isExpanded ? 'Collapse width' : 'Expand width'}
          aria-label={isExpanded ? 'Collapse width' : 'Expand width'}
        >
          {isExpanded ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="bg-deep-ink/10 mx-0.5 h-4 w-px" />

        <button
          onClick={onClose}
          className="text-slate hover:text-deep-ink hover:bg-soft-meadow cursor-pointer rounded-lg p-1.5 transition-colors"
          title="Close Studio (Esc)"
          aria-label="Close Studio"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
