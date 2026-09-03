'use client'

import React, { useState } from 'react'
import { CheckCircle2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RESOURCE_TEMPLATES } from '../constants'
import type { ActivityItem } from '../types'

interface ResourcesTabProps {
  onReadResource: (uri: string) => Promise<any>
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void
}

export function ResourcesTab({ onReadResource, logActivity }: ResourcesTabProps) {
  const [resourceUri, setResourceUri] = useState('patient://patient-1')
  const [resourceResult, setResourceResult] = useState<any>(null)
  const [isReadingResource, setIsReadingResource] = useState(false)
  const [resourceTimeMs, setResourceTimeMs] = useState<number | null>(null)

  const handleRead = async (uriToRead?: string) => {
    const uri = uriToRead || resourceUri
    setIsReadingResource(true)
    setResourceResult(null)
    const start = performance.now()

    try {
      const result = await onReadResource(uri)
      const duration = Math.round(performance.now() - start)
      setResourceTimeMs(duration)
      setResourceResult(result)

      logActivity({
        type: 'resource',
        target: uri,
        durationMs: duration,
        status: 'success',
        output: result,
      })
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      setResourceTimeMs(duration)
      const errorObj = { error: err?.message || String(err) }
      setResourceResult(errorObj)

      logActivity({
        type: 'resource',
        target: uri,
        durationMs: duration,
        status: 'error',
        output: errorObj,
      })
    } finally {
      setIsReadingResource(false)
    }
  }

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-white">
      <div>
        <h3 className="font-serif font-bold text-sm text-deep-ink">RFC 6570 Resource Explorer</h3>
        <p className="text-xs text-slate mt-0.5">
          Inspect structured healthcare data records directly over Model Context Protocol URI schemes.
        </p>
      </div>

      {/* URI Input Bar */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-deep-ink block">Resource URI</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={resourceUri}
            onChange={e => setResourceUri(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRead()}
            placeholder="patient://patient-1"
            className="flex-1 px-3.5 py-2 text-xs bg-canvas/30 border border-deep-ink/20 rounded-full font-mono focus:outline-none focus:ring-1 focus:ring-hi-yellow text-deep-ink"
          />
          <Button
            onClick={() => handleRead()}
            disabled={isReadingResource}
            className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-bold px-5 cursor-pointer shadow-xs"
          >
            {isReadingResource ? 'Reading...' : 'Read'}
          </Button>
        </div>
      </div>

      {/* Quick URI Template Cards */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider text-slate font-bold">Quick Resource Templates:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RESOURCE_TEMPLATES.map(item => (
            <button
              key={item.uri}
              onClick={() => {
                setResourceUri(item.uri)
                handleRead(item.uri)
              }}
              className="text-left p-2.5 rounded-2xl bg-canvas hover:bg-soft-meadow border border-deep-ink/5 hover:border-deep-ink/15 transition-all text-xs cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-semibold text-deep-ink text-xs">{item.label}</span>
                <span className="text-[10px] font-mono text-slate group-hover:text-deep-ink">Read &rarr;</span>
              </div>
              <p className="font-mono text-[10px] text-deep-ink/70 truncate">{item.uri}</p>
              <p className="text-[10px] text-slate mt-0.5">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Resource Output Viewer */}
      {resourceResult && (
        <div className="space-y-2 pt-2 border-t border-deep-ink/10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-moss-green" />
              <span className="font-bold text-deep-ink">Resource Content</span>
              {resourceTimeMs !== null && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {resourceTimeMs} ms
                </Badge>
              )}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(resourceResult, null, 2))
              }}
              className="text-slate hover:text-deep-ink text-xs flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>

          <pre className="bg-deep-ink text-white font-mono text-[11px] p-4 rounded-2xl overflow-auto max-h-80 leading-relaxed">
            {JSON.stringify(resourceResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
