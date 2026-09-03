'use client'

import React from 'react'
import { Sparkles, RefreshCw, Maximize2, Minimize2, X } from 'lucide-react'

interface InspectorHeaderProps {
  isExpanded: boolean
  isSyncing: boolean
  onToggleExpand: () => void
  onRefresh: () => void
  onClose: () => void
}

export function InspectorHeader({
  isExpanded,
  isSyncing,
  onToggleExpand,
  onRefresh,
  onClose,
}: InspectorHeaderProps) {
  return (
    <div className="px-5 py-3 border-b border-deep-ink/10 bg-canvas flex items-center justify-between gap-3 shrink-0">
      {/* Left: Brand & Runtime Context */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-deep-ink flex items-center justify-center text-hi-yellow shadow-2xs shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-deep-ink text-sm tracking-tight whitespace-nowrap leading-none">
              WebMCP Studio
            </h2>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate bg-soft-meadow px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 border border-deep-ink/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Ready</span>
            </div>
          </div>
          <p className="text-[11px] text-slate font-mono mt-0.5 truncate leading-tight">
            document.modelContext <span className="text-slate/40">•</span> /api/mcp
          </p>
        </div>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          className="p-1.5 rounded-lg text-slate hover:text-deep-ink hover:bg-soft-meadow transition-colors cursor-pointer"
          title="Sync definitions from server"
          aria-label="Refresh tools"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-deep-ink' : ''}`} />
        </button>

        <button
          onClick={onToggleExpand}
          className="p-1.5 rounded-lg text-slate hover:text-deep-ink hover:bg-soft-meadow transition-colors cursor-pointer"
          title={isExpanded ? 'Collapse width' : 'Expand width'}
          aria-label={isExpanded ? 'Collapse width' : 'Expand width'}
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <div className="h-4 w-px bg-deep-ink/10 mx-0.5" />

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate hover:text-deep-ink hover:bg-soft-meadow transition-colors cursor-pointer"
          title="Close Studio (Esc)"
          aria-label="Close Studio"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
