'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

interface LauncherProps {
  toolCount: number
  onToggle: () => void
}

export function Launcher({ toolCount, onToggle }: LauncherProps) {
  return (
    <div className="fixed bottom-5 right-5 z-40">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-deep-ink/90 hover:bg-deep-ink text-white shadow-md hover:shadow-lg transition-all duration-150 border border-white/10 hover:border-white/20 active:scale-[0.98] cursor-pointer group"
        title="Open WebMCP Studio (Ctrl + Shift + M)"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <Sparkles className="w-3.5 h-3.5 text-hi-yellow/90 group-hover:text-hi-yellow transition-colors" />
        <span className="text-xs font-medium tracking-tight">WebMCP</span>
        <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-white/15 text-white/90">
          {toolCount}
        </span>
      </button>
    </div>
  )
}
