'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LauncherProps {
  toolCount: number
  onToggle: () => void
}

export function Launcher({ toolCount, onToggle }: LauncherProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={onToggle}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-deep-ink text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border border-hi-yellow/30 group cursor-pointer"
        title="Toggle WebMCP Studio (Ctrl + Shift + M)"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moss-green opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-moss-green" />
        </span>
        <Sparkles className="w-3.5 h-3.5 text-hi-yellow transition-transform duration-300 group-hover:rotate-12" />
        <span className="font-semibold text-xs tracking-wide">WebMCP</span>
        <Badge className="bg-hi-yellow text-deep-ink text-[10px] px-1.5 py-0 h-4 font-mono font-bold rounded-full border-none shadow-xs">
          {toolCount}
        </Badge>
      </button>
    </div>
  )
}
