'use client';

import React, { useState } from 'react';
import { CheckCircle2, Copy, ArrowRight, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RESOURCE_TEMPLATES } from '../constants';
import type { ActivityItem } from '../types';

interface ResourcesProps {
  onReadResource: (uri: string) => Promise<any>;
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
}

export function ResourcesTab({ onReadResource, logActivity }: ResourcesProps) {
  const [resourceUri, setResourceUri] = useState('patient://patient-1');
  const [resourceResult, setResourceResult] = useState<any>(null);
  const [isReadingResource, setIsReadingResource] = useState(false);
  const [resourceTimeMs, setResourceTimeMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRead = async (uriToRead?: string) => {
    const uri = uriToRead || resourceUri;
    setIsReadingResource(true);
    setResourceResult(null);
    const start = performance.now();

    try {
      const result = await onReadResource(uri);
      const duration = Math.round(performance.now() - start);
      setResourceTimeMs(duration);
      setResourceResult(result);

      logActivity({
        type: 'resource',
        target: uri,
        durationMs: duration,
        status: 'success',
        output: result,
      });
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setResourceTimeMs(duration);
      const errorObj = { error: err?.message || String(err) };
      setResourceResult(errorObj);

      logActivity({
        type: 'resource',
        target: uri,
        durationMs: duration,
        status: 'error',
        output: errorObj,
      });
    } finally {
      setIsReadingResource(false);
    }
  };

  const handleCopy = () => {
    if (!resourceResult) return;
    navigator.clipboard.writeText(JSON.stringify(resourceResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-canvas mx-auto w-full max-w-4xl flex-1 space-y-5 overflow-y-auto p-5 font-sans md:p-6">
      <div>
        <h3 className="text-deep-ink font-serif text-base font-bold tracking-tight">
          Resource Explorer
        </h3>
        <p className="text-slate mt-0.5 text-xs">
          Inspect structured clinical data records directly over Model Context
          Protocol URI schemes.
        </p>
      </div>

      {/* URI Input Bar Card */}
      <div className="border-deep-ink/10 space-y-2 rounded-2xl border bg-white p-4 shadow-2xs">
        <label className="text-deep-ink block text-xs font-medium">
          Target Resource URI
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={resourceUri}
            onChange={(e) => setResourceUri(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRead()}
            placeholder="patient://patient-1"
            className="bg-soft-meadow/50 border-deep-ink/10 focus:ring-deep-ink/20 text-deep-ink flex-1 rounded-lg border px-3.5 py-1.5 font-mono text-xs transition-colors focus:ring-1 focus:outline-none"
          />
          <Button
            variant="default"
            size="sm"
            onClick={() => handleRead()}
            disabled={isReadingResource}
            className="border-deep-ink/10 h-8 cursor-pointer rounded-lg border px-4 text-xs font-semibold shadow-2xs transition-transform active:scale-95"
          >
            {isReadingResource ? 'Reading...' : 'Read Resource'}
          </Button>
        </div>
      </div>

      {/* Quick Resource Templates Grid */}
      <div className="space-y-2">
        <span className="text-deep-ink block text-xs font-medium">
          Clinical Resource Presets
        </span>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {RESOURCE_TEMPLATES.map((item) => (
            <button
              key={item.uri}
              onClick={() => {
                setResourceUri(item.uri);
                handleRead(item.uri);
              }}
              className="hover:bg-soft-meadow/30 border-deep-ink/10 hover:border-deep-ink/20 group cursor-pointer rounded-xl border bg-white p-3.5 text-left text-xs shadow-2xs transition-all"
            >
              <div className="mb-1 flex items-center justify-between gap-1">
                <span className="text-deep-ink text-xs font-medium">
                  {item.label}
                </span>
                <span className="text-slate/70 group-hover:text-deep-ink flex items-center gap-1 text-[11px]">
                  <span>Read</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
              <p className="text-deep-ink/80 bg-soft-meadow border-deep-ink/5 mb-1 inline-block truncate rounded border px-1.5 py-0.5 font-mono text-[10px]">
                {item.uri}
              </p>
              <p className="text-slate text-xs leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Resource Output Card */}
      {resourceResult && (
        <div className="border-deep-ink/10 space-y-2 border-t pt-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-deep-ink text-xs font-medium">
                Resource Output Payload
              </span>
              {resourceTimeMs !== null && (
                <span className="border-deep-ink/10 text-slate rounded-md border bg-white px-2 py-0.5 font-mono text-[11px]">
                  {resourceTimeMs} ms
                </span>
              )}
            </div>
            <button
              onClick={handleCopy}
              className="text-slate hover:text-deep-ink hover:bg-soft-meadow flex cursor-pointer items-center gap-1 rounded-lg p-1 text-xs transition-colors"
            >
              {copied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="bg-deep-ink selection:bg-hi-yellow selection:text-deep-ink max-h-72 overflow-auto rounded-xl p-4 font-mono text-xs leading-relaxed text-[#eff2e5] shadow-sm">
            {JSON.stringify(resourceResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
