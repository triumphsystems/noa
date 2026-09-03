'use client'

import React, { useState } from 'react'
import { CheckCircle2, Copy, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5 bg-canvas max-w-4xl mx-auto w-full">
      <div>
        <h3 className="font-serif font-bold text-lg text-deep-ink tracking-tight">RFC 6570 Resource Explorer</h3>
        <p className="text-xs text-slate mt-0.5">
          Inspect structured healthcare data records directly over Model Context Protocol URI schemes.
        </p>
      </div>

      {/* URI Input Bar Card */}
      <div className="p-4 rounded-2xl bg-soft-meadow/70 border border-deep-ink/10 space-y-2.5">
        <label className="text-[10px] uppercase tracking-wider font-bold text-slate block">
          Target Resource URI
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={resourceUri}
            onChange={e => setResourceUri(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRead()}
            placeholder="patient://patient-1"
            className="flex-1 px-3.5 py-2 text-xs bg-canvas border border-deep-ink/15 rounded-full font-mono focus:outline-none focus:ring-2 focus:ring-deep-ink/15 text-deep-ink shadow-xs"
          />
          <Button
            onClick={() => handleRead()}
            disabled={isReadingResource}
            className="rounded-full bg-hi-yellow hover:bg-[#ebd020] text-deep-ink text-xs font-bold px-5 shadow-xs cursor-pointer border border-deep-ink/10 transition-transform active:scale-95"
          >
            {isReadingResource ? 'Reading...' : 'Read Resource'}
          </Button>
        </div>
      </div>

      {/* Quick Resource Templates Grid */}
      <div className="space-y-2.5">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate block">
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
              className="text-left p-3.5 rounded-2xl bg-soft-meadow/70 hover:bg-soft-meadow border border-deep-ink/10 hover:border-deep-ink/20 transition-all text-xs cursor-pointer group shadow-xs hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-serif font-bold text-deep-ink text-xs">{item.label}</span>
                <span className="text-[11px] font-medium text-slate group-hover:text-deep-ink flex items-center gap-1">
                  <span>Read</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
              <p className="font-mono text-[10px] text-deep-ink/70 truncate bg-canvas px-1.5 py-0.5 rounded-md border border-deep-ink/5 inline-block mb-1">
                {item.uri}
              </p>
              <p className="text-[11px] text-slate leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Resource Output Card */}
      {resourceResult && (
        <div className="space-y-2.5 pt-3 border-t border-deep-ink/10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-moss-green" />
              <span className="font-serif font-bold text-sm text-deep-ink">Resource Output Payload</span>
              {resourceTimeMs !== null && (
                <Badge variant="outline" className="text-[10px] font-mono border-deep-ink/10 bg-soft-meadow">
                  {resourceTimeMs} ms
                </Badge>
              )}
            </div>
            <button
              onClick={handleCopy}
              className="text-slate hover:text-deep-ink text-xs flex items-center gap-1 cursor-pointer p-1 hover:bg-soft-meadow rounded-lg transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-moss-green" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="bg-deep-ink text-[#eff2e5] font-mono text-[11px] p-4 rounded-2xl overflow-auto max-h-72 leading-relaxed shadow-md selection:bg-hi-yellow selection:text-deep-ink">
            {JSON.stringify(resourceResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
