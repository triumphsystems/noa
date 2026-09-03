'use client'

import React, { useState } from 'react'
import { Check, AlertCircle, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TOOL_PRESETS } from '../constants'
import type { ActivityItem } from '../types'

interface RegisterProps {
  onRegisterTool: (tool: {
    name: string
    description: string
    inputSchema: any
    execute: (input: any) => Promise<any>
  }) => void
  onRefreshRegistry: () => void
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void
}

export function RegisterTab({ onRegisterTool, onRefreshRegistry, logActivity }: RegisterProps) {
  const [selectedPresetId, setSelectedPresetId] = useState('bmi')
  const [customToolName, setCustomToolName] = useState(TOOL_PRESETS[0].name)
  const [customToolDesc, setCustomToolDesc] = useState(TOOL_PRESETS[0].desc)
  const [customToolCode, setCustomToolCode] = useState(TOOL_PRESETS[0].code)
  const [registrationNotice, setRegistrationNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

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
    <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5 bg-canvas max-w-4xl mx-auto w-full font-sans">
      <div>
        <h3 className="font-serif font-bold text-base text-deep-ink tracking-tight">Tool Registration</h3>
        <p className="text-xs text-slate mt-0.5">
          Register new callable clinical tools live into{' '}
          <code className="bg-soft-meadow px-1.5 py-0.5 rounded font-mono text-xs text-deep-ink">
            document.modelContext
          </code>{' '}
          at runtime.
        </p>
      </div>

      {/* Notification Banner */}
      {registrationNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
            registrationNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {registrationNotice.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{registrationNotice.message}</span>
        </div>
      )}

      {/* Preset Picker Cards */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-deep-ink block">
          Clinical Presets
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {TOOL_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedPresetId(preset.id)
                setCustomToolName(preset.name)
                setCustomToolDesc(preset.desc)
                setCustomToolCode(preset.code)
              }}
              className={`text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                selectedPresetId === preset.id
                  ? 'bg-white border-deep-ink/30 shadow-xs'
                  : 'bg-white/60 border-deep-ink/10 hover:border-deep-ink/20 hover:bg-white text-slate hover:text-deep-ink'
              }`}
            >
              <span className="font-mono font-medium text-deep-ink text-xs block mb-0.5">{preset.name}</span>
              <span className="text-xs text-slate line-clamp-2 leading-relaxed">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Fields Card */}
      <div className="p-5 rounded-2xl bg-white border border-deep-ink/10 space-y-3.5 shadow-2xs">
        <div>
          <label className="text-xs font-medium text-deep-ink block mb-1">Tool Name</label>
          <input
            type="text"
            value={customToolName}
            onChange={e => setCustomToolName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-canvas/60 border border-deep-ink/10 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-deep-ink/20 text-deep-ink transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-deep-ink block mb-1">Description</label>
          <input
            type="text"
            value={customToolDesc}
            onChange={e => setCustomToolDesc(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-canvas/60 border border-deep-ink/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-deep-ink/20 text-deep-ink transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-deep-ink block mb-1">
            JavaScript Execution Body
          </label>
          <textarea
            value={customToolCode}
            onChange={e => setCustomToolCode(e.target.value)}
            rows={7}
            className="w-full font-mono text-xs p-3 bg-canvas/60 border border-deep-ink/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-deep-ink/20 leading-relaxed text-deep-ink resize-y"
          />
        </div>

        <div className="flex items-center justify-end pt-1">
          <Button
            onClick={handleRegister}
            className="rounded-full bg-hi-yellow hover:bg-[#ebd020] text-deep-ink text-xs font-semibold gap-2 px-5 py-1.5 shadow-2xs cursor-pointer transition-transform active:scale-95 border border-deep-ink/10 h-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Register Tool in document.modelContext</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
