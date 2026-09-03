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
import { Badge } from '@/components/ui/badge'
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
          sampleInput[key] = 'session-1'
        } else if (key === 'chiefComplaint') {
          sampleInput[key] = 'Shortness of breath on exertion'
        } else if (key === 'symptoms') {
          sampleInput[key] = 'Wheezing, nocturnal cough, tightness in chest'
        } else if (key === 'soapNote') {
          sampleInput[key] =
            'SUBJECTIVE: Patient reports worsening asthma symptoms. ASSESSMENT: Mild acute exacerbation. PLAN: Inhaled corticosteroid step-up.'
        } else if (key === 'text') {
          sampleInput[key] = 'Live transcript update: Patient denies fever or chills.'
        } else if (prop.type === 'string') {
          sampleInput[key] = `sample_${key}`
        } else if (prop.type === 'number') {
          sampleInput[key] = 70
        } else if (prop.type === 'boolean') {
          sampleInput[key] = true
        } else if (prop.type === 'array') {
          sampleInput[key] = ['item_1']
        } else if (prop.type === 'object') {
          sampleInput[key] = {}
        }
      })
    }

    setToolInputJson(JSON.stringify(sampleInput, null, 2))
    setExecutionResult(null)
    setExecutionTimeMs(null)
  }

  const handleExecute = async () => {
    if (!selectedTool) return
    setIsExecuting(true)
    setExecutionResult(null)
    const start = performance.now()

    try {
      let parsed = {}
      try {
        parsed = JSON.parse(toolInputJson)
      } catch {
        throw new Error('Input argument is not valid JSON')
      }

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
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-canvas">
      {/* Search & Category Header with Pure Cream Background */}
      <div className="px-5 py-3 border-b border-deep-ink/10 bg-canvas flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
          <input
            type="text"
            placeholder="Search tools by name or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-soft-meadow/80 border border-deep-ink/15 rounded-full focus:outline-none focus:ring-2 focus:ring-deep-ink/15 text-deep-ink shadow-xs transition-all placeholder:text-slate/60"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {(['all', 'clinical', 'records', 'database', 'browser'] as ToolCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setToolCategory(cat)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer capitalize ${
                toolCategory === cat
                  ? 'bg-deep-ink text-white font-semibold shadow-xs'
                  : 'bg-soft-meadow border border-deep-ink/10 text-slate hover:text-deep-ink hover:bg-canvas'
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
        <div className="w-60 sm:w-68 shrink-0 border-r border-deep-ink/10 flex flex-col bg-canvas/80 overflow-y-auto p-2.5 space-y-1.5">
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
                  className={`w-full text-left p-3 rounded-2xl transition-all text-xs cursor-pointer border ${
                    isSelected
                      ? 'bg-soft-meadow border-hi-yellow shadow-xs ring-1 ring-hi-yellow/50'
                      : 'bg-canvas border-deep-ink/10 hover:border-deep-ink/20 hover:bg-soft-meadow/50 text-slate hover:text-deep-ink'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-bold text-deep-ink truncate text-[11px]">{tool.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isClient ? 'bg-moss-green/20 text-deep-ink' : 'bg-soft-meadow text-slate'
                      }`}
                    >
                      {isClient ? 'browser' : 'server'}
                    </span>
                  </div>
                  <p className="text-[11px] line-clamp-2 text-slate mb-1.5 leading-relaxed">{tool.description}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate/80 font-mono">
                    <Layers className="w-3 h-3 text-slate" />
                    <span>
                      {propCount} parameter{propCount === 1 ? '' : 's'}
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
              <div className="bg-soft-meadow/70 border border-deep-ink/10 rounded-2xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <h3 className="font-mono text-sm font-bold text-deep-ink break-all">
                      {currentToolObj.name}
                    </h3>
                    <span
                      className={`whitespace-nowrap shrink-0 text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full ${
                        currentToolObj.name.startsWith('client_')
                          ? 'bg-moss-green/20 text-deep-ink'
                          : 'bg-deep-ink/10 text-slate'
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
                      className="text-xs h-7 rounded-full gap-1 px-2.5 bg-canvas hover:bg-soft-meadow border-deep-ink/15 cursor-pointer"
                      title="Copy as cURL command"
                    >
                      {copiedCurl ? <Check className="w-3 h-3 text-moss-green" /> : <Share2 className="w-3 h-3" />}
                      <span>{copiedCurl ? 'Copied' : 'cURL'}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectTool(currentToolObj)}
                      className="text-xs h-7 rounded-full text-slate hover:text-deep-ink px-2 cursor-pointer"
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
                  <div className="border border-deep-ink/10 rounded-2xl bg-soft-meadow/50 overflow-hidden">
                    <button
                      onClick={() => setShowSchemaAccordion(prev => !prev)}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-deep-ink hover:bg-soft-meadow transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate" />
                        <span>Parameters Schema ({Object.keys(currentToolObj.inputSchema.properties).length})</span>
                      </span>
                      {showSchemaAccordion ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate" />
                      )}
                    </button>

                    {showSchemaAccordion && (
                      <div className="p-3 border-t border-deep-ink/10 space-y-1.5 bg-canvas/40">
                        {Object.entries(currentToolObj.inputSchema.properties).map(([name, prop]: [string, any]) => {
                          const isRequired = currentToolObj.inputSchema?.required?.includes(name)
                          return (
                            <div
                              key={name}
                              className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 bg-canvas p-2.5 rounded-xl border border-deep-ink/10"
                            >
                              <div className="flex items-center gap-1.5 min-w-[140px]">
                                <span className="font-mono font-bold text-deep-ink text-xs">{name}</span>
                                {isRequired && (
                                  <span className="text-[9px] text-red-700 bg-red-100 px-1 py-0.2 rounded-full font-bold">
                                    Req
                                  </span>
                                )}
                                <span className="text-[10px] text-slate font-mono">({prop.type || 'any'})</span>
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
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate">
                    Input Arguments (JSON)
                  </label>
                  <button
                    onClick={handleFormatJson}
                    className="text-xs font-medium text-slate hover:text-deep-ink hover:underline cursor-pointer"
                  >
                    Beautify JSON
                  </button>
                </div>
                <textarea
                  value={toolInputJson}
                  onChange={e => setToolInputJson(e.target.value)}
                  rows={7}
                  className="w-full font-mono text-xs p-3.5 bg-soft-meadow/60 border border-deep-ink/15 rounded-2xl focus:outline-none focus:ring-2 focus:ring-deep-ink/15 leading-relaxed text-deep-ink shadow-xs resize-y"
                  placeholder="{}"
                />
              </div>

              {/* Execution Trigger Bar */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate">
                  Invoked via <code className="font-mono font-semibold text-deep-ink">document.modelContext</code>
                </p>
                <Button
                  size="sm"
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="rounded-full bg-hi-yellow hover:bg-[#ebd020] text-deep-ink text-xs font-bold gap-1.5 px-5 py-2 shadow-xs cursor-pointer transition-transform active:scale-95 border border-deep-ink/10"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isExecuting ? 'Executing...' : 'Execute Tool'}
                </Button>
              </div>

              {/* Result Console Display */}
              {executionResult && (
                <div className="space-y-2 pt-3 border-t border-deep-ink/10">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-deep-ink flex items-center gap-1.5">
                        {executionResult.isError || executionResult.error ? (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-moss-green" />
                        )}
                        <span>Execution Output</span>
                      </span>
                      {executionTimeMs !== null && (
                        <Badge variant="outline" className="text-[10px] font-mono border-deep-ink/10 bg-soft-meadow">
                          {executionTimeMs} ms
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex bg-soft-meadow rounded-full p-0.5 text-xs">
                        <button
                          onClick={() => setResultViewMode('preview')}
                          className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                            resultViewMode === 'preview'
                              ? 'bg-canvas font-bold text-deep-ink shadow-xs'
                              : 'text-slate hover:text-deep-ink'
                          }`}
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => setResultViewMode('json')}
                          className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                            resultViewMode === 'json'
                              ? 'bg-canvas font-bold text-deep-ink shadow-xs'
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
                        {copiedResult ? <Check className="w-3 h-3 text-moss-green" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedResult ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {resultViewMode === 'preview' && executionResult.content?.[0]?.text ? (
                    <div className="bg-soft-meadow border border-deep-ink/10 p-4 rounded-2xl text-xs space-y-2 max-h-72 overflow-y-auto">
                      <div className="font-mono text-deep-ink whitespace-pre-wrap leading-relaxed">
                        {executionResult.content[0].text}
                      </div>
                    </div>
                  ) : (
                    <pre className="bg-deep-ink text-[#eff2e5] font-mono text-[11px] p-4 rounded-2xl overflow-auto max-h-72 leading-relaxed shadow-md selection:bg-hi-yellow selection:text-deep-ink">
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
              <p className="max-w-xs text-slate text-[11px] leading-relaxed">
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
