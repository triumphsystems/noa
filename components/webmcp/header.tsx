'use client'

import React from 'react'
import { Sparkles, RefreshCw, Maximize2, Minimize2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
    <div className="p-4 border-b border-deep-ink/10 bg-canvas flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-deep-ink flex items-center justify-center text-hi-yellow shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-deep-ink text-base">WebMCP Studio</h2>
            <Badge variant="outline" className="text-[10px] font-mono bg-white border-deep-ink/15 text-deep-ink">
              v2024-11-05
            </Badge>
            <div className="flex items-center gap-1 text-[11px] text-moss-green font-medium">
              <span className="w-2 h-2 rounded-full bg-moss-green inline-block animate-pulse" />
              <span className="text-[11px] text-slate font-sans">Ready</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate mt-0.5 font-mono">
            <span>document.modelContext</span>
            <span>•</span>
            <span>/api/mcp</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          className="p-2 rounded-xl text-slate hover:text-deep-ink hover:bg-soft-meadow transition-colors cursor-pointer"
          title="Sync tools and resources from server"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-hi-yellow' : ''}`} />
        </button>

        <button
          onClick={onToggleExpand}
          className="p-2 rounded-xl text-slate hover:text-deep-ink hover:bg-soft-meadow transition-colors cursor-pointer"
          title={isExpanded ? 'Collapse drawer width' : 'Maximize workbench width'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-mono text-slate bg-soft-meadow rounded-lg border border-deep-ink/10">
          Ctrl+Shift+M
        </kbd>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate hover:text-deep-ink hover:bg-soft-meadow transition-colors cursor-pointer"
          title="Close Inspector (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
