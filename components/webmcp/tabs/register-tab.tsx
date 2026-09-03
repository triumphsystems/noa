'use client'

import React, { useState } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TOOL_PRESETS } from '../constants'
import type { ActivityItem } from '../types'

interface RegisterTabProps {
  onRegisterTool: (tool: { name: string; description: string; inputSchema: any; execute: (input: any) => Promise<any> }) => void
  onRefreshRegistry: () => void
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void
}

export function RegisterTab({ onRegisterTool, onRefreshRegistry, logActivity }: RegisterTabProps) {
  const [selectedPresetId, setSelectedPresetId] = useState('bmi')
  const [customToolName, setCustomToolName] = useState(TOOL_PRESETS[0].name)
  const [customToolDesc, setCustomToolDesc] = useState(TOOL_PRESETS[0].desc)
  const [customToolCode, setCustomToolCode] = useState(TOOL_PRESETS[0].code)
  const [registrationNotice, setRegistrationNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleRegister = () => {
    if (!customToolName) return

    try {
      const preset = TOOL_PRESETS.find(p => p.id === selectedPresetId)
      const properties = preset ? preset.params : { input: { type: 'string' } }

      // eslint-disable-next-line no-new-func
      const execFn = new Function('input', customToolCode)

      onRegisterTool({
        name: customToolName,
        description: customToolDesc,
        inputSchema: {
          type: 'object',
          properties: properties as any,
          required: Object.keys(properties),
        },
        execute: async (input: any) => {
          return execFn(input)
        },
      })

      setRegistrationNotice({
        type: 'success',
        message: `Registered tool "${customToolName}" into document.modelContext. Available immediately in the Tools tab!`,
      })

      logActivity({
        type: 'register',
        target: customToolName,
        status: 'success',
        output: { name: customToolName, description: customToolDesc },
      })

      onRefreshRegistry()
      setTimeout(() => setRegistrationNotice(null), 6000)
    } catch (err: any) {
      setRegistrationNotice({
        type: 'error',
        message: `Registration failed: ${err?.message || String(err)}`,
      })
    }
  }

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-white">
      <div>
        <h3 className="font-serif font-bold text-sm text-deep-ink">Dynamic Tool Registration Builder</h3>
        <p className="text-xs text-slate mt-0.5">
          Register new callable clinical tools live into{' '}
          <code className="bg-soft-meadow px-1 py-0.5 rounded font-mono">document.modelContext</code> at runtime.
        </p>
      </div>

      {/* Notification */}
      {registrationNotice && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
            registrationNotice.type === 'success'
              ? 'bg-moss-green/15 border-moss-green/30 text-deep-ink'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {registrationNotice.type === 'success' ? (
            <Check className="w-4 h-4 text-moss-green shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{registrationNotice.message}</span>
        </div>
      )}

      {/* Preset Picker */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate font-bold">Choose Clinical Preset:</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TOOL_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedPresetId(preset.id)
                setCustomToolName(preset.name)
                setCustomToolDesc(preset.desc)
                setCustomToolCode(preset.code)
              }}
              className={`text-left p-2.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                selectedPresetId === preset.id
                  ? 'bg-hi-yellow/20 border-hi-yellow text-deep-ink font-bold shadow-xs'
                  : 'bg-canvas border-deep-ink/5 hover:border-deep-ink/20 text-slate hover:text-deep-ink'
              }`}
            >
              <span className="font-mono text-[11px] block">{preset.name}</span>
              <span className="text-[10px] text-slate line-clamp-1 mt-0.5">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tool Config Fields */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-deep-ink block mb-1">Tool Name</label>
          <input
            type="text"
            value={customToolName}
            onChange={e => setCustomToolName(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-canvas/30 border border-deep-ink/20 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-hi-yellow text-deep-ink"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-deep-ink block mb-1">Description</label>
          <input
            type="text"
            value={customToolDesc}
            onChange={e => setCustomToolDesc(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-canvas/30 border border-deep-ink/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-hi-yellow text-deep-ink"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-deep-ink block mb-1">
            Execution Logic <span className="font-normal text-slate text-[11px]">(JavaScript function body)</span>
          </label>
          <textarea
            value={customToolCode}
            onChange={e => setCustomToolCode(e.target.value)}
            rows={8}
            className="w-full font-mono text-xs p-3 bg-canvas/30 border border-deep-ink/20 rounded-2xl focus:outline-none focus:ring-1 focus:ring-hi-yellow leading-relaxed text-deep-ink"
          />
        </div>

        <Button
          onClick={handleRegister}
          className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-bold py-2.5 shadow-xs cursor-pointer"
        >
          Register Tool in document.modelContext
        </Button>
      </div>
    </div>
  )
}
