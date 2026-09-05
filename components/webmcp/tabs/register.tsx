'use client';

import React, { useState } from 'react';
import { Check, AlertCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TOOL_PRESETS } from '../constants';
import type { ActivityItem } from '../types';

interface RegisterProps {
  onRegisterTool: (tool: {
    name: string;
    description: string;
    inputSchema: any;
    execute: (input: any) => Promise<any>;
  }) => void;
  onRefreshRegistry: () => void;
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
}

export function RegisterTab({
  onRegisterTool,
  onRefreshRegistry,
  logActivity,
}: RegisterProps) {
  const [selectedPresetId, setSelectedPresetId] = useState('bmi');
  const [customToolName, setCustomToolName] = useState(TOOL_PRESETS[0].name);
  const [customToolDesc, setCustomToolDesc] = useState(TOOL_PRESETS[0].desc);
  const [customToolCode, setCustomToolCode] = useState(TOOL_PRESETS[0].code);
  const [registrationNotice, setRegistrationNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleRegister = () => {
    if (!customToolName) return;

    try {
      const preset = TOOL_PRESETS.find((p) => p.id === selectedPresetId);
      const properties = preset ? preset.params : { input: { type: 'string' } };

      // eslint-disable-next-line no-new-func
      const execFn = new Function('input', customToolCode);

      onRegisterTool({
        name: customToolName,
        description: customToolDesc,
        inputSchema: {
          type: 'object',
          properties: properties as any,
          required: Object.keys(properties),
        },
        execute: async (input: any) => {
          return execFn(input);
        },
      });

      setRegistrationNotice({
        type: 'success',
        message: `Registered tool "${customToolName}" into document.modelContext. Available immediately in the Tools tab!`,
      });

      logActivity({
        type: 'register',
        target: customToolName,
        status: 'success',
        output: { name: customToolName, description: customToolDesc },
      });

      onRefreshRegistry();
      setTimeout(() => setRegistrationNotice(null), 6000);
    } catch (err: any) {
      setRegistrationNotice({
        type: 'error',
        message: `Registration failed: ${err?.message || String(err)}`,
      });
    }
  };

  return (
    <div className="bg-canvas mx-auto w-full max-w-4xl flex-1 space-y-5 overflow-y-auto p-5 font-sans md:p-6">
      <div>
        <h3 className="text-deep-ink font-serif text-base font-bold tracking-tight">
          Tool Registration
        </h3>
        <p className="text-slate mt-0.5 text-xs">
          Register new callable clinical tools live into{' '}
          <code className="bg-soft-meadow text-deep-ink rounded px-1.5 py-0.5 font-mono text-xs">
            document.modelContext
          </code>{' '}
          at runtime.
        </p>
      </div>

      {/* Notification Banner */}
      {registrationNotice && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-3.5 text-xs font-medium ${
            registrationNotice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {registrationNotice.type === 'success' ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          )}
          <span>{registrationNotice.message}</span>
        </div>
      )}

      {/* Preset Picker Cards */}
      <div className="space-y-2">
        <span className="text-deep-ink block text-xs font-medium">
          Clinical Presets
        </span>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {TOOL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedPresetId(preset.id);
                setCustomToolName(preset.name);
                setCustomToolDesc(preset.desc);
                setCustomToolCode(preset.code);
              }}
              className={`cursor-pointer rounded-xl border p-3.5 text-left text-xs transition-all ${
                selectedPresetId === preset.id
                  ? 'border-deep-ink/30 bg-white shadow-xs'
                  : 'border-deep-ink/10 hover:border-deep-ink/20 text-slate hover:text-deep-ink bg-white/60 hover:bg-white'
              }`}
            >
              <span className="text-deep-ink mb-0.5 block font-mono text-xs font-medium">
                {preset.name}
              </span>
              <span className="text-slate line-clamp-2 text-xs leading-relaxed">
                {preset.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Fields Card */}
      <div className="border-deep-ink/10 space-y-3.5 rounded-2xl border bg-white p-5 shadow-2xs">
        <div>
          <label className="text-deep-ink mb-1 block text-xs font-medium">
            Tool Name
          </label>
          <input
            type="text"
            value={customToolName}
            onChange={(e) => setCustomToolName(e.target.value)}
            className="bg-canvas/60 border-deep-ink/10 focus:ring-deep-ink/20 text-deep-ink w-full rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors focus:ring-1 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-deep-ink mb-1 block text-xs font-medium">
            Description
          </label>
          <input
            type="text"
            value={customToolDesc}
            onChange={(e) => setCustomToolDesc(e.target.value)}
            className="bg-canvas/60 border-deep-ink/10 focus:ring-deep-ink/20 text-deep-ink w-full rounded-lg border px-3 py-1.5 text-xs transition-colors focus:ring-1 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-deep-ink mb-1 block text-xs font-medium">
            JavaScript Execution Body
          </label>
          <textarea
            value={customToolCode}
            onChange={(e) => setCustomToolCode(e.target.value)}
            rows={7}
            className="bg-canvas/60 border-deep-ink/10 focus:ring-deep-ink/20 text-deep-ink w-full resize-y rounded-lg border p-3 font-mono text-xs leading-relaxed focus:ring-1 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end pt-1">
          <Button
            onClick={handleRegister}
            className="bg-hi-yellow text-deep-ink border-deep-ink/10 h-auto cursor-pointer gap-2 rounded-full border px-5 py-1.5 text-xs font-semibold shadow-2xs transition-transform hover:bg-[#ebd020] active:scale-95"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Register Tool in document.modelContext</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
