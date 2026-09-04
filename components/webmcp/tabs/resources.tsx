'use client'

import React, { useState } from 'react'
import { CheckCircle2, Copy, ArrowRight, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RESOURCE_TEMPLATES } from '../constants'
import type { ActivityItem } from '../types'

interface ResourcesProps {
  onReadResource: (uri: string) => Promise<any>
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void
}

export function ResourcesTab({ onReadResource, logActivity }: ResourcesProps) {
  const [resourceUri, setResourceUri] = useState('patient://patient-1')
  const [resourceResult, setResourceResult] = useState<any>(null)
  const [isReadingResource, setIsReadingResource] = useState(false)
  const [resourceTimeMs, setResourceTimeMs] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

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

  const handleCopy = () => {
    if (!resourceResult) return
    navigator.clipboard.writeText(JSON.stringify(resourceResult, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5 bg-canvas max-w-4xl mx-auto w-full font-sans">
      <div>
        <h3 className="font-serif font-bold text-base text-deep-ink tracking-tight">Resource Explorer</h3>
        <p className="text-xs text-slate mt-0.5">
          Inspect structured clinical data records directly over Model Context Protocol URI schemes.
        </p>
      </div>

      {/* URI Input Bar Card */}
      <div className="p-4 rounded-2xl bg-white border border-deep-ink/10 space-y-2 shadow-2xs">
        <label className="text-xs font-medium text-deep-ink block">
          Target Resource URI
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={resourceUri}
            onChange={e => setResourceUri(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRead()}
            placeholder="patient://patient-1"
            className="flex-1 px-3.5 py-1.5 text-xs bg-soft-meadow/50 border border-deep-ink/10 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-deep-ink/20 text-deep-ink transition-colors"
          />
          <Button
            variant="default"
            size="sm"
            onClick={() => handleRead()}
            disabled={isReadingResource}
            className="rounded-lg text-xs font-semibold px-4 h-8 shadow-2xs cursor-pointer border border-deep-ink/10 transition-transform active:scale-95"
          >
            {isReadingResource ? 'Reading...' : 'Read Resource'}
          </Button>
        </div>
      </div>

      {/* Quick Resource Templates Grid */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-deep-ink block">
          Clinical Resource Presets
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {RESOURCE_TEMPLATES.map(item => (
            <button
              key={item.uri}
              onClick={() => {
                setResourceUri(item.uri)
                handleRead(item.uri)
              }}
              className="text-left p-3.5 rounded-xl bg-white hover:bg-soft-meadow/30 border border-deep-ink/10 hover:border-deep-ink/20 transition-all text-xs cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-medium text-deep-ink text-xs">{item.label}</span>
                <span className="text-[11px] text-slate/70 group-hover:text-deep-ink flex items-center gap-1">
                  <span>Read</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
              <p className="font-mono text-[10px] text-deep-ink/80 truncate bg-soft-meadow px-1.5 py-0.5 rounded border border-deep-ink/5 inline-block mb-1">
                {item.uri}
              </p>
              <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Resource Output Card */}
      {resourceResult && (
        <div className="space-y-2 pt-3 border-t border-deep-ink/10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium text-deep-ink text-xs">Resource Output Payload</span>
              {resourceTimeMs !== null && (
                <span className="text-[11px] font-mono border border-deep-ink/10 bg-white px-2 py-0.5 rounded-md text-slate">
                  {resourceTimeMs} ms
                </span>
              )}
            </div>
            <button
              onClick={handleCopy}
              className="text-slate hover:text-deep-ink text-xs flex items-center gap-1 cursor-pointer p-1 hover:bg-soft-meadow rounded-lg transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="bg-deep-ink text-[#eff2e5] font-mono text-xs p-4 rounded-xl overflow-auto max-h-72 leading-relaxed shadow-sm selection:bg-hi-yellow selection:text-deep-ink">
            {JSON.stringify(resourceResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
