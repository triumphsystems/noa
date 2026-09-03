'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LauncherButtonProps {
  toolCount: number
  onToggle: () => void
}

export function LauncherButton({ toolCount, onToggle }: LauncherButtonProps) {
  return (
    <div className="fixed bottom-5 right-5 z-40">
      <button
        onClick={onToggle}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-deep-ink text-white shadow-2xl hover:bg-deep-ink/90 transition-all border border-hi-yellow/40 hover:scale-105 active:scale-95 group cursor-pointer"
        title="Toggle WebMCP Inspector (Ctrl + Shift + M)"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moss-green opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-moss-green" />
        </span>
        <Sparkles className="w-4 h-4 text-hi-yellow transition-transform group-hover:rotate-12" />
        <span className="font-semibold text-xs tracking-wide">WebMCP Studio</span>
        <Badge className="bg-hi-yellow text-deep-ink text-[10px] px-2 py-0.5 h-4 font-mono font-bold rounded-full border-none">
          {toolCount}
        </Badge>
      </button>
    </div>
  )
}
