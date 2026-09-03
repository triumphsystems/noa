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
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-deep-ink flex items-center justify-center text-hi-yellow shadow-xs shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-deep-ink text-base whitespace-nowrap leading-none">
              WebMCP Studio
            </h2>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate bg-soft-meadow px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 border border-deep-ink/5">
              <span className="w-1.5 h-1.5 rounded-full bg-moss-green" />
              <span>Ready</span>
            </div>
          </div>
          <p className="text-[10px] text-slate font-mono mt-0.5 truncate leading-tight">
            document.modelContext <span className="text-slate/40">•</span> /api/mcp
          </p>
        </div>
      </div>

      {/* Right: Studio Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          className="p-1.5 rounded-full text-slate hover:text-deep-ink hover:bg-soft-meadow transition-all cursor-pointer"
          title="Sync definitions from server"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-deep-ink' : ''}`} />
        </button>

        <button
          onClick={onToggleExpand}
          className="p-1.5 rounded-full text-slate hover:text-deep-ink hover:bg-soft-meadow transition-all cursor-pointer"
          title={isExpanded ? 'Collapse width' : 'Expand width'}
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onClose}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-deep-ink bg-hi-yellow hover:bg-[#ebd020] transition-all cursor-pointer border border-deep-ink/15 shadow-xs shrink-0"
          title="Close (Esc)"
        >
          <X className="w-3.5 h-3.5" />
          <span>Close</span>
        </button>
      </div>
    </div>
  )
}
