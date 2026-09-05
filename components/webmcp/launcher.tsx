'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface LauncherProps {
  toolCount: number;
  onToggle: () => void;
}

export function Launcher({ toolCount, onToggle }: LauncherProps) {
  return (
    <div className="fixed right-5 bottom-5 z-40">
      <button
        onClick={onToggle}
        className="bg-deep-ink/90 hover:bg-deep-ink group flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-white shadow-md transition-all duration-150 hover:border-white/20 hover:shadow-lg active:scale-[0.98]"
        title="Open WebMCP Studio (Ctrl + Shift + M)"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <Sparkles className="text-hi-yellow/90 group-hover:text-hi-yellow h-3.5 w-3.5 transition-colors" />
        <span className="text-xs font-medium tracking-tight">WebMCP</span>
        <span className="py-0.2 rounded-full bg-white/15 px-1.5 font-mono text-[11px] text-white/90">
          {toolCount}
        </span>
      </button>
    </div>
  );
}
