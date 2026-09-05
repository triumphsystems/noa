'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Layers,
  Terminal,
  Share2,
  Check,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ToolDefinition } from '@/lib/webmcp/core/types';
import type { ToolCategory, ActivityItem } from '../types';

interface ToolsProps {
  tools: ToolDefinition[];
  onExecuteTool: (name: string, input: Record<string, any>) => Promise<any>;
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
}

export function ToolsTab({ tools, onExecuteTool, logActivity }: ToolsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [toolCategory, setToolCategory] = useState<ToolCategory>('all');
  const [selectedTool, setSelectedTool] = useState<string | null>(
    tools[0]?.name || null
  );
  const [toolInputJson, setToolInputJson] = useState<string>('{}');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [showSchemaAccordion, setShowSchemaAccordion] = useState(true);
  const [resultViewMode, setResultViewMode] = useState<'preview' | 'json'>(
    'preview'
  );
  const [copiedResult, setCopiedResult] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Auto-select first tool if none selected
  useEffect(() => {
    if (tools.length > 0 && !selectedTool) {
      handleSelectTool(tools[0]);
    }
  }, [tools, selectedTool]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (toolCategory === 'clinical') {
        return (
          tool.name.includes('soap') ||
          tool.name.includes('suggestion') ||
          tool.name.includes('insight') ||
          tool.name.includes('triage')
        );
      }
      if (toolCategory === 'records') {
        return tool.name.includes('intake') || tool.name.includes('patient');
      }
      if (toolCategory === 'database') {
        return (
          tool.name.includes('get_') ||
          tool.name.includes('save_') ||
          tool.name.includes('fetch_') ||
          tool.name.includes('history')
        );
      }
      if (toolCategory === 'browser') {
        return tool.name.startsWith('client_');
      }
      return true;
    });
  }, [tools, searchQuery, toolCategory]);

  const currentToolObj = useMemo(() => {
    return tools.find((t) => t.name === selectedTool);
  }, [tools, selectedTool]);

  const handleSelectTool = (tool: ToolDefinition) => {
    setSelectedTool(tool.name);
    const sampleInput: Record<string, any> = {};

    if (tool.inputSchema?.properties) {
      Object.entries(tool.inputSchema.properties).forEach(([key, prop]) => {
        if (key === 'transcript') {
          sampleInput[key] =
            'Doctor: Good morning John, what brings you in today?\nPatient: I have had persistent dry cough and slight fever for 3 days.\nDoctor: Any shortness of breath or chest pain?\nPatient: Mild chest tightness when coughing, but no acute pain.';
        } else if (key === 'patientId') {
          sampleInput[key] = 'patient-1';
        } else if (key === 'doctorId') {
          sampleInput[key] = 'doctor-1';
        } else if (key === 'sessionId') {
          sampleInput[key] = 'session-101';
        } else if (key === 'category') {
          sampleInput[key] = 'medication';
        } else if (key === 'urgency') {
          sampleInput[key] = 'routine';
        } else if (key === 'query') {
          sampleInput[key] = 'hypertension';
        } else if (key === 'status') {
          sampleInput[key] = 'completed';
        } else if (key === 'intakeData') {
          sampleInput[key] = {
            chiefComplaint: 'Mild chest tightness with seasonal allergies',
            symptoms: ['cough', 'congestion'],
            vitals: { bp: '124/80', pulse: 72, temp: 98.6 },
          };
        } else if (key === 'soapData') {
          sampleInput[key] = {
            subjective: 'Patient reports improved BP with current dosage.',
            objective: 'BP 124/80, pulse 72.',
            assessment: 'Controlled primary hypertension.',
            plan: 'Continue lisinopril 10mg daily.',
          };
        } else if (key === 'reason') {
          sampleInput[key] = 'Follow-up on blood pressure adjustment';
        } else if (key === 'scheduledAt') {
          sampleInput[key] = new Date(Date.now() + 86400000).toISOString();
        } else if (key === 'notes') {
          sampleInput[key] =
            'Patient tolerated medication change without orthostatic symptoms.';
        } else {
          sampleInput[key] =
            (prop as any).type === 'number'
              ? 1
              : (prop as any).type === 'boolean'
                ? true
                : (prop as any).type === 'array'
                  ? []
                  : (prop as any).type === 'object'
                    ? {}
                    : 'sample';
        }
      });
    }

    setToolInputJson(JSON.stringify(sampleInput, null, 2));
    setExecutionResult(null);
    setExecutionTimeMs(null);
  };

  const handleExecute = async () => {
    if (!selectedTool) return;

    let parsed = {};
    try {
      parsed = JSON.parse(toolInputJson);
    } catch {
      setExecutionResult({
        error: 'Invalid JSON input. Please format your arguments correctly.',
      });
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);
    const start = performance.now();

    try {
      const result = await onExecuteTool(selectedTool, parsed);
      const duration = Math.round(performance.now() - start);
      setExecutionTimeMs(duration);
      setExecutionResult(result);

      logActivity({
        type: 'tool',
        target: selectedTool,
        durationMs: duration,
        status: (result as any)?.isError ? 'error' : 'success',
        input: parsed,
        output: result,
      });
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setExecutionTimeMs(duration);
      const errorObj = { error: err?.message || String(err) };
      setExecutionResult(errorObj);

      logActivity({
        type: 'tool',
        target: selectedTool,
        durationMs: duration,
        status: 'error',
        input: toolInputJson,
        output: errorObj,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyResult = () => {
    if (!executionResult) return;
    navigator.clipboard.writeText(JSON.stringify(executionResult, null, 2));
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const handleCopyCurl = () => {
    if (!selectedTool) return;
    let parsed = {};
    try {
      parsed = JSON.parse(toolInputJson);
    } catch {
      parsed = {};
    }

    const curl = `curl -X POST http://localhost:3000/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: selectedTool,
        arguments: parsed,
      },
    },
    null,
    2
  )}'`;

    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(toolInputJson);
      setToolInputJson(JSON.stringify(parsed, null, 2));
    } catch {
      // Ignore if invalid
    }
  };

  return (
    <div className="bg-canvas flex min-h-0 flex-1 flex-col overflow-hidden font-sans">
      {/* Search & Category Header with Pure Cream Background */}
      <div className="border-deep-ink/10 bg-canvas flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-5">
        <div className="max-w-sm min-w-[220px] flex-1">
          <div className="border-deep-ink/12 focus-within:border-deep-ink/30 focus-within:ring-deep-ink/10 flex h-10 min-h-[40px] items-center gap-2.5 rounded-xl border bg-white/80 px-3.5 shadow-2xs transition-all focus-within:bg-white focus-within:ring-2">
            <Search className="text-slate/70 pointer-events-none h-4 w-4 shrink-0" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-deep-ink placeholder:text-slate/60 w-full border-none bg-transparent p-0 text-xs leading-normal outline-none focus:ring-0 sm:text-sm"
            />
          </div>
        </div>

        {/* Category Filter Controls */}
        <div className="flex scrollbar-none items-center gap-1.5 overflow-x-auto py-1">
          {(
            [
              'all',
              'clinical',
              'records',
              'database',
              'browser',
            ] as ToolCategory[]
          ).map((cat) => (
            <button
              key={cat}
              onClick={() => setToolCategory(cat)}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                toolCategory === cat
                  ? 'bg-deep-ink text-white shadow-xs'
                  : 'text-slate hover:text-deep-ink hover:border-deep-ink/10 border border-transparent hover:bg-white/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Split View Layout with Cream Canvas */}
      <div className="bg-canvas flex min-h-0 flex-1 overflow-hidden">
        {/* Left Pane: Tool List Sidebar */}
        <div className="border-deep-ink/10 bg-canvas/60 flex w-72 max-w-[300px] min-w-[260px] shrink-0 flex-col space-y-2 overflow-y-auto border-r p-3">
          {filteredTools.length === 0 ? (
            <div className="text-slate p-6 text-center text-xs">
              No tools match your criteria.
            </div>
          ) : (
            filteredTools.map((tool) => {
              const isClient = tool.name.startsWith('client_');
              const isSelected = selectedTool === tool.name;
              const propCount = Object.keys(
                tool.inputSchema?.properties || {}
              ).length;

              return (
                <div
                  key={tool.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectTool(tool)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectTool(tool);
                    }
                  }}
                  className={`flex w-full cursor-pointer flex-col gap-1.5 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-deep-ink/25 ring-deep-ink/10 bg-white shadow-xs ring-1'
                      : 'border-deep-ink/6 hover:border-deep-ink/15 text-slate hover:text-deep-ink bg-white/50 hover:bg-white'
                  }`}
                >
                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <span className="text-deep-ink flex-1 truncate font-mono text-xs leading-normal font-semibold">
                      {tool.name}
                    </span>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-medium ${
                        isClient
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'bg-soft-meadow border-deep-ink/10 text-deep-ink/80 border'
                      }`}
                    >
                      {isClient ? 'client' : 'rpc'}
                    </span>
                  </div>
                  {tool.description && (
                    <span className="text-slate line-clamp-2 block text-[11px] leading-relaxed break-words">
                      {tool.description}
                    </span>
                  )}
                  <div className="text-slate/70 flex items-center gap-1.5 pt-0.5 font-mono text-[11px]">
                    <Layers className="h-3 w-3 shrink-0 opacity-70" />
                    <span>
                      {propCount} param{propCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Pane: Workbench & Execution Playground */}
        <div className="bg-canvas flex min-w-0 flex-1 flex-col space-y-5 overflow-y-auto p-5 sm:p-6">
          {currentToolObj ? (
            <>
              {/* Tool Header Card */}
              <div className="border-deep-ink/10 space-y-3 rounded-2xl border bg-white p-5 shadow-2xs sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                    <h3 className="text-deep-ink font-mono text-sm font-semibold break-all">
                      {currentToolObj.name}
                    </h3>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] whitespace-nowrap ${
                        currentToolObj.name.startsWith('client_')
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'bg-deep-ink/5 text-slate'
                      }`}
                    >
                      {currentToolObj.name.startsWith('client_')
                        ? 'in-browser'
                        : 'JSON-RPC 2.0'}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCurl}
                      className="bg-canvas hover:bg-soft-meadow border-deep-ink/10 h-7 cursor-pointer gap-1.5 rounded-lg px-3 text-xs"
                      title="Copy as cURL command"
                    >
                      {copiedCurl ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Share2 className="h-3 w-3" />
                      )}
                      <span>{copiedCurl ? 'Copied' : 'cURL'}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectTool(currentToolObj)}
                      className="text-slate hover:text-deep-ink h-7 cursor-pointer rounded-lg px-2.5 text-xs"
                      title="Reset to sample inputs"
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                <p className="text-slate text-xs leading-relaxed sm:text-sm">
                  {currentToolObj.description}
                </p>
              </div>

              {/* Parameter Schema Breakdown */}
              {currentToolObj.inputSchema?.properties &&
                Object.keys(currentToolObj.inputSchema.properties).length >
                  0 && (
                  <div className="border-deep-ink/10 overflow-hidden rounded-2xl border bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setShowSchemaAccordion((prev) => !prev)}
                      className="text-deep-ink hover:bg-soft-meadow/40 flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-xs font-medium transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="text-slate h-3.5 w-3.5 shrink-0" />
                        <span className="leading-normal">
                          Parameters (
                          {
                            Object.keys(currentToolObj.inputSchema.properties)
                              .length
                          }
                          )
                        </span>
                      </span>
                      {showSchemaAccordion ? (
                        <ChevronDown className="text-slate h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="text-slate h-3.5 w-3.5 shrink-0" />
                      )}
                    </button>

                    {showSchemaAccordion && (
                      <div className="border-deep-ink/8 bg-canvas/30 space-y-2 border-t p-4 sm:p-5">
                        {Object.entries(
                          currentToolObj.inputSchema.properties
                        ).map(([name, prop]: [string, any]) => {
                          const isRequired =
                            currentToolObj.inputSchema?.required?.includes(
                              name
                            );
                          return (
                            <div
                              key={name}
                              className="border-deep-ink/6 flex flex-col gap-2.5 rounded-xl border bg-white p-3.5 sm:flex-row sm:items-baseline"
                            >
                              <div className="flex min-w-[140px] items-center gap-2">
                                <span className="text-deep-ink font-mono text-xs font-medium">
                                  {name}
                                </span>
                                {isRequired && (
                                  <span className="py-0.2 rounded-md border border-amber-200 bg-amber-50 px-1.5 text-[10px] font-medium text-amber-700">
                                    Required
                                  </span>
                                )}
                                <span className="text-slate/70 font-mono text-[11px]">
                                  ({prop.type || 'any'})
                                </span>
                              </div>
                              <span className="text-slate flex-1 text-xs">
                                {prop.description || 'No description provided'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              {/* Input Arguments JSON Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-deep-ink text-xs font-medium">
                    Input Arguments (JSON)
                  </label>
                  <button
                    onClick={handleFormatJson}
                    className="text-slate hover:text-deep-ink cursor-pointer text-xs font-medium hover:underline"
                  >
                    Format JSON
                  </button>
                </div>
                <textarea
                  value={toolInputJson}
                  onChange={(e) => setToolInputJson(e.target.value)}
                  rows={8}
                  className="border-deep-ink/15 focus:ring-deep-ink/30 text-deep-ink w-full resize-y rounded-xl border bg-white p-4 font-mono text-xs leading-relaxed shadow-2xs focus:ring-1 focus:outline-none"
                  placeholder="{}"
                />
              </div>

              {/* Execution Trigger Bar */}
              <div className="border-deep-ink/8 flex flex-wrap items-center justify-between gap-3 border-t pt-3 pb-2">
                <p className="text-slate text-xs">
                  Target runtime:{' '}
                  <code className="text-deep-ink bg-soft-meadow/80 border-deep-ink/8 rounded border px-2 py-0.5 font-mono">
                    document.modelContext
                  </code>
                </p>
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="bg-hi-yellow text-deep-ink border-deep-ink/15 inline-flex h-10 min-h-[40px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border px-5 text-xs font-bold shadow-xs transition-all hover:bg-[#ebd020] hover:shadow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="fill-deep-ink text-deep-ink h-3.5 w-3.5 shrink-0" />
                  <span>{isExecuting ? 'Executing...' : 'Execute Tool'}</span>
                </button>
              </div>

              {/* Result Console Display */}
              {executionResult && (
                <div className="border-deep-ink/10 space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-deep-ink flex items-center gap-1.5 font-medium">
                        {executionResult.isError || executionResult.error ? (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                        <span>Execution Output</span>
                      </span>
                      {executionTimeMs !== null && (
                        <span className="border-deep-ink/10 text-slate rounded-md border bg-white px-2 py-0.5 font-mono text-[11px]">
                          {executionTimeMs} ms
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="bg-soft-meadow/80 flex rounded-lg p-0.5 text-xs">
                        <button
                          onClick={() => setResultViewMode('preview')}
                          className={`cursor-pointer rounded-md px-2.5 py-0.5 transition-colors ${
                            resultViewMode === 'preview'
                              ? 'text-deep-ink bg-white font-medium shadow-2xs'
                              : 'text-slate hover:text-deep-ink'
                          }`}
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => setResultViewMode('json')}
                          className={`cursor-pointer rounded-md px-2.5 py-0.5 transition-colors ${
                            resultViewMode === 'json'
                              ? 'text-deep-ink bg-white font-medium shadow-2xs'
                              : 'text-slate hover:text-deep-ink'
                          }`}
                        >
                          Raw JSON
                        </button>
                      </div>

                      <button
                        onClick={handleCopyResult}
                        className="text-slate hover:text-deep-ink hover:bg-soft-meadow ml-1 flex cursor-pointer items-center gap-1 rounded-lg p-1 text-xs"
                      >
                        {copiedResult ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copiedResult ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {resultViewMode === 'preview' &&
                  executionResult.content?.[0]?.text ? (
                    <div className="border-deep-ink/10 max-h-72 space-y-2 overflow-y-auto rounded-xl border bg-white p-4 text-xs shadow-2xs">
                      <div className="text-deep-ink font-mono leading-relaxed whitespace-pre-wrap">
                        {executionResult.content[0].text}
                      </div>
                    </div>
                  ) : (
                    <pre className="bg-deep-ink selection:bg-hi-yellow selection:text-deep-ink max-h-72 overflow-auto rounded-xl p-4 font-mono text-xs leading-relaxed text-[#eff2e5] shadow-sm">
                      {JSON.stringify(executionResult, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-slate flex flex-1 flex-col items-center justify-center space-y-2 p-8 text-center text-xs">
              <Terminal className="text-slate/30 mb-1 h-8 w-8" />
              <p className="text-deep-ink font-serif text-sm font-bold">
                Select a clinical tool
              </p>
              <p className="text-slate max-w-xs text-xs leading-relaxed">
                Choose any clinical AI, database, or browser action tool from
                the list on the left to inspect its schema and execute it live.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
