'use client'

import React, { useState, useMemo, useEffect } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ToolDefinition } from '@/lib/webmcp/core/types'
import type { ToolCategory, ActivityItem } from '../types'

interface ToolsProps {
  tools: ToolDefinition[]
  onExecuteTool: (name: string, input: Record<string, any>) => Promise<any>
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void
}

export function ToolsTab({ tools, onExecuteTool, logActivity }: ToolsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [toolCategory, setToolCategory] = useState<ToolCategory>('all')
  const [selectedTool, setSelectedTool] = useState<string | null>(tools[0]?.name || null)
  const [toolInputJson, setToolInputJson] = useState<string>('{}')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null)
  const [showSchemaAccordion, setShowSchemaAccordion] = useState(true)
  const [resultViewMode, setResultViewMode] = useState<'preview' | 'json'>('preview')
  const [copiedResult, setCopiedResult] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)

  // Auto-select first tool if none selected
  useEffect(() => {
    if (tools.length > 0 && !selectedTool) {
      handleSelectTool(tools[0])
    }
  }, [tools, selectedTool])

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (toolCategory === 'clinical') {
        return (
          tool.name.includes('soap') ||
          tool.name.includes('suggestion') ||
          tool.name.includes('insight') ||
          tool.name.includes('triage')
        )
      }
      if (toolCategory === 'records') {
        return tool.name.includes('intake') || tool.name.includes('patient')
      }
      if (toolCategory === 'database') {
        return (
          tool.name.includes('get_') ||
          tool.name.includes('save_') ||
          tool.name.includes('fetch_') ||
          tool.name.includes('history')
        )
      }
      if (toolCategory === 'browser') {
        return tool.name.startsWith('client_')
      }
      return true
    })
  }, [tools, searchQuery, toolCategory])

  const currentToolObj = useMemo(() => {
    return tools.find(t => t.name === selectedTool)
  }, [tools, selectedTool])

  const handleSelectTool = (tool: ToolDefinition) => {
    setSelectedTool(tool.name)
    const sampleInput: Record<string, any> = {}

    if (tool.inputSchema?.properties) {
      Object.entries(tool.inputSchema.properties).forEach(([key, prop]) => {
        if (key === 'transcript') {
          sampleInput[key] =
            'Doctor: Good morning John, what brings you in today?\nPatient: I have had persistent dry cough and slight fever for 3 days.\nDoctor: Any shortness of breath or chest pain?\nPatient: Mild chest tightness when coughing, but no acute pain.'
        } else if (key === 'patientId') {
          sampleInput[key] = 'patient-1'
        } else if (key === 'doctorId') {
          sampleInput[key] = 'doctor-1'
        } else if (key === 'sessionId') {
          sampleInput[key] = 'session-101'
        } else if (key === 'category') {
          sampleInput[key] = 'medication'
        } else if (key === 'urgency') {
          sampleInput[key] = 'routine'
        } else if (key === 'query') {
          sampleInput[key] = 'hypertension'
        } else if (key === 'status') {
          sampleInput[key] = 'completed'
        } else if (key === 'intakeData') {
          sampleInput[key] = {
            chiefComplaint: 'Mild chest tightness with seasonal allergies',
            symptoms: ['cough', 'congestion'],
            vitals: { bp: '124/80', pulse: 72, temp: 98.6 },
          }
        } else if (key === 'soapData') {
          sampleInput[key] = {
            subjective: 'Patient reports improved BP with current dosage.',
            objective: 'BP 124/80, pulse 72.',
            assessment: 'Controlled primary hypertension.',
            plan: 'Continue lisinopril 10mg daily.',
          }
        } else if (key === 'reason') {
          sampleInput[key] = 'Follow-up on blood pressure adjustment'
        } else if (key === 'scheduledAt') {
          sampleInput[key] = new Date(Date.now() + 86400000).toISOString()
        } else if (key === 'notes') {
          sampleInput[key] = 'Patient tolerated medication change without orthostatic symptoms.'
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
              : 'sample'
        }
      })
    }

    setToolInputJson(JSON.stringify(sampleInput, null, 2))
    setExecutionResult(null)
    setExecutionTimeMs(null)
  }

  const handleExecute = async () => {
    if (!selectedTool) return

    let parsed = {}
    try {
      parsed = JSON.parse(toolInputJson)
    } catch {
      setExecutionResult({ error: 'Invalid JSON input. Please format your arguments correctly.' })
      return
    }

    setIsExecuting(true)
    setExecutionResult(null)
    const start = performance.now()

    try {
      const result = await onExecuteTool(selectedTool, parsed)
      const duration = Math.round(performance.now() - start)
      setExecutionTimeMs(duration)
      setExecutionResult(result)

      logActivity({
        type: 'tool',
        target: selectedTool,
        durationMs: duration,
        status: (result as any)?.isError ? 'error' : 'success',
        input: parsed,
        output: result,
      })
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      setExecutionTimeMs(duration)
      const errorObj = { error: err?.message || String(err) }
      setExecutionResult(errorObj)

      logActivity({
        type: 'tool',
        target: selectedTool,
        durationMs: duration,
        status: 'error',
        input: toolInputJson,
        output: errorObj,
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleCopyResult = () => {
    if (!executionResult) return
    navigator.clipboard.writeText(JSON.stringify(executionResult, null, 2))
    setCopiedResult(true)
    setTimeout(() => setCopiedResult(false), 2000)
  }

  const handleCopyCurl = () => {
    if (!selectedTool) return
    let parsed = {}
    try {
      parsed = JSON.parse(toolInputJson)
    } catch {
      parsed = {}
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
  )}'`

    navigator.clipboard.writeText(curl)
    setCopiedCurl(true)
    setTimeout(() => setCopiedCurl(false), 2000)
  }

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(toolInputJson)
      setToolInputJson(JSON.stringify(parsed, null, 2))
    } catch {
      // Ignore if invalid
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-canvas font-sans">
      {/* Search & Category Header with Pure Cream Background */}
      <div className="px-5 py-2.5 border-b border-deep-ink/10 bg-canvas flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate/70 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-soft-meadow/70 border border-deep-ink/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-deep-ink/20 text-deep-ink placeholder:text-slate/60 transition-colors"
          />
        </div>

        {/* Category Filter Controls */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {(['all', 'clinical', 'records', 'database', 'browser'] as ToolCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setToolCategory(cat)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer capitalize ${
                toolCategory === cat
                  ? 'bg-deep-ink text-white font-medium shadow-2xs'
                  : 'text-slate hover:text-deep-ink hover:bg-soft-meadow/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Split View Layout with Cream Canvas */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-canvas">
        {/* Left Pane: Tool List Sidebar */}
        <div className="w-60 sm:w-64 shrink-0 border-r border-deep-ink/10 flex flex-col bg-canvas/60 overflow-y-auto p-2 space-y-1">
          {filteredTools.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate">No tools match your criteria.</div>
          ) : (
            filteredTools.map(tool => {
              const isClient = tool.name.startsWith('client_')
              const isSelected = selectedTool === tool.name
              const propCount = Object.keys(tool.inputSchema?.properties || {}).length

              return (
                <button
                  key={tool.name}
                  onClick={() => handleSelectTool(tool)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all text-xs cursor-pointer border ${
                    isSelected
                      ? 'bg-white border-deep-ink/20 shadow-xs'
                      : 'bg-transparent border-transparent hover:bg-white/60 hover:border-deep-ink/5 text-slate hover:text-deep-ink'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-medium text-deep-ink truncate text-xs">{tool.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        isClient ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-deep-ink/5 text-slate'
                      }`}
                    >
                      {isClient ? 'client' : 'rpc'}
                    </span>
                  </div>
                  <p className="text-xs line-clamp-2 text-slate mb-1 leading-relaxed">{tool.description}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate/70 font-mono">
                    <Layers className="w-3 h-3 opacity-70" />
                    <span>
                      {propCount} param{propCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Right Pane: Workbench & Execution Playground */}
        <div className="flex-1 min-w-0 flex flex-col bg-canvas overflow-y-auto p-4 sm:p-5 space-y-4">
          {currentToolObj ? (
            <>
              {/* Tool Header Card */}
              <div className="bg-white border border-deep-ink/10 rounded-2xl p-4 space-y-2 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <h3 className="font-mono text-xs font-semibold text-deep-ink break-all">
                      {currentToolObj.name}
                    </h3>
                    <span
                      className={`whitespace-nowrap shrink-0 text-[10px] font-mono px-2 py-0.2 rounded-md ${
                        currentToolObj.name.startsWith('client_')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-deep-ink/5 text-slate'
                      }`}
                    >
                      {currentToolObj.name.startsWith('client_') ? 'in-browser' : 'JSON-RPC 2.0'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCurl}
                      className="text-xs h-7 rounded-lg gap-1 px-2.5 bg-canvas hover:bg-soft-meadow border-deep-ink/10 cursor-pointer"
                      title="Copy as cURL command"
                    >
                      {copiedCurl ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3" />}
                      <span>{copiedCurl ? 'Copied' : 'cURL'}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectTool(currentToolObj)}
                      className="text-xs h-7 rounded-lg text-slate hover:text-deep-ink px-2 cursor-pointer"
                      title="Reset to sample inputs"
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-slate leading-relaxed">{currentToolObj.description}</p>
              </div>

              {/* Parameter Schema Breakdown */}
              {currentToolObj.inputSchema?.properties &&
                Object.keys(currentToolObj.inputSchema.properties).length > 0 && (
                  <div className="border border-deep-ink/10 rounded-2xl bg-white overflow-hidden shadow-2xs">
                    <button
                      onClick={() => setShowSchemaAccordion(prev => !prev)}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-deep-ink hover:bg-soft-meadow/40 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate" />
                        <span>Parameters ({Object.keys(currentToolObj.inputSchema.properties).length})</span>
                      </span>
                      {showSchemaAccordion ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate" />
                      )}
                    </button>

                    {showSchemaAccordion && (
                      <div className="p-3 border-t border-deep-ink/8 space-y-1.5 bg-canvas/30">
                        {Object.entries(currentToolObj.inputSchema.properties).map(([name, prop]: [string, any]) => {
                          const isRequired = currentToolObj.inputSchema?.required?.includes(name)
                          return (
                            <div
                              key={name}
                              className="flex flex-col sm:flex-row sm:items-baseline gap-2 bg-white p-2.5 rounded-xl border border-deep-ink/6"
                            >
                              <div className="flex items-center gap-1.5 min-w-[140px]">
                                <span className="font-mono font-medium text-deep-ink text-xs">{name}</span>
                                {isRequired && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded-md font-medium">
                                    Required
                                  </span>
                                )}
                                <span className="text-[11px] text-slate/70 font-mono">({prop.type || 'any'})</span>
                              </div>
                              <span className="text-xs text-slate flex-1">
                                {prop.description || 'No description provided'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

              {/* Input Arguments JSON Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-deep-ink">
                    Input Arguments (JSON)
                  </label>
                  <button
                    onClick={handleFormatJson}
                    className="text-xs font-medium text-slate hover:text-deep-ink hover:underline cursor-pointer"
                  >
                    Format JSON
                  </button>
                </div>
                <textarea
                  value={toolInputJson}
                  onChange={e => setToolInputJson(e.target.value)}
                  rows={7}
                  className="w-full font-mono text-xs p-3.5 bg-white border border-deep-ink/15 rounded-xl focus:outline-none focus:ring-1 focus:ring-deep-ink/30 leading-relaxed text-deep-ink shadow-2xs resize-y"
                  placeholder="{}"
                />
              </div>

              {/* Execution Trigger Bar */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate">
                  Target runtime: <code className="font-mono text-deep-ink">document.modelContext</code>
                </p>
                <Button
                  size="sm"
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="rounded-full bg-hi-yellow hover:bg-[#ebd020] text-deep-ink text-xs font-semibold gap-1.5 px-4 py-1.5 shadow-2xs cursor-pointer border border-deep-ink/10 transition-transform active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {isExecuting ? 'Executing...' : 'Execute Tool'}
                </Button>
              </div>

              {/* Result Console Display */}
              {executionResult && (
                <div className="space-y-2 pt-3 border-t border-deep-ink/10">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-deep-ink flex items-center gap-1.5">
                        {executionResult.isError || executionResult.error ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>Execution Output</span>
                      </span>
                      {executionTimeMs !== null && (
                        <span className="text-[11px] font-mono border border-deep-ink/10 bg-white px-2 py-0.5 rounded-md text-slate">
                          {executionTimeMs} ms
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex bg-soft-meadow/80 rounded-lg p-0.5 text-xs">
                        <button
                          onClick={() => setResultViewMode('preview')}
                          className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                            resultViewMode === 'preview'
                              ? 'bg-white font-medium text-deep-ink shadow-2xs'
                              : 'text-slate hover:text-deep-ink'
                          }`}
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => setResultViewMode('json')}
                          className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                            resultViewMode === 'json'
                              ? 'bg-white font-medium text-deep-ink shadow-2xs'
                              : 'text-slate hover:text-deep-ink'
                          }`}
                        >
                          Raw JSON
                        </button>
                      </div>

                      <button
                        onClick={handleCopyResult}
                        className="text-slate hover:text-deep-ink text-xs flex items-center gap-1 cursor-pointer ml-1 p-1 hover:bg-soft-meadow rounded-lg"
                      >
                        {copiedResult ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedResult ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {resultViewMode === 'preview' && executionResult.content?.[0]?.text ? (
                    <div className="bg-white border border-deep-ink/10 p-4 rounded-xl text-xs space-y-2 max-h-72 overflow-y-auto shadow-2xs">
                      <div className="font-mono text-deep-ink whitespace-pre-wrap leading-relaxed">
                        {executionResult.content[0].text}
                      </div>
                    </div>
                  ) : (
                    <pre className="bg-deep-ink text-[#eff2e5] font-mono text-xs p-4 rounded-xl overflow-auto max-h-72 leading-relaxed shadow-sm selection:bg-hi-yellow selection:text-deep-ink">
                      {JSON.stringify(executionResult, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate text-xs space-y-2">
              <Terminal className="w-8 h-8 text-slate/30 mb-1" />
              <p className="font-serif font-bold text-sm text-deep-ink">Select a clinical tool</p>
              <p className="max-w-xs text-slate text-xs leading-relaxed">
                Choose any clinical AI, database, or browser action tool from the list on the left to inspect its schema
                and execute it live.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
