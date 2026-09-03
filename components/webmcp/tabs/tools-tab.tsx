'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Layers,
  Terminal,
  Share2,
  Check,
  Code,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ToolDefinition } from '@/lib/webmcp/core/types'
import type { ToolCategory, ActivityItem } from '../types'

interface ToolsTabProps {
  tools: ToolDefinition[]
  onExecuteTool: (name: string, input: Record<string, any>) => Promise<any>
  logActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void
}

export function ToolsTab({ tools, onExecuteTool, logActivity }: ToolsTabProps) {
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
  React.useEffect(() => {
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
            'Doctor: Hello John, how are you feeling today?\nPatient: I have had persistent dry cough and mild fever for three days.\nDoctor: Any difficulty breathing?\nPatient: Only mild chest tightness.'
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter & Search Header */}
      <div className="p-3 border-b border-deep-ink/10 bg-canvas/60 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate" />
          <input
            type="text"
            placeholder="Search tools by name or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-deep-ink/15 rounded-full focus:outline-none focus:ring-1 focus:ring-hi-yellow"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {(['all', 'clinical', 'records', 'database', 'browser'] as ToolCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setToolCategory(cat)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer capitalize ${
                toolCategory === cat
                  ? 'bg-deep-ink text-white font-semibold'
                  : 'bg-soft-meadow/80 text-slate hover:text-deep-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Split Screen: Tool List & Runner */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* Tool List Column */}
        <div className="sm:w-5/12 lg:w-4/12 border-r border-deep-ink/10 overflow-y-auto p-2 space-y-1.5 bg-canvas/30 max-h-56 sm:max-h-none">
          {filteredTools.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate">No tools match your filter criteria.</div>
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
                      ? 'bg-hi-yellow/25 border-hi-yellow text-deep-ink shadow-xs'
                      : 'bg-white border-deep-ink/5 hover:border-deep-ink/20 hover:bg-soft-meadow/40 text-slate hover:text-deep-ink'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-bold text-deep-ink truncate text-[11px]">{tool.name}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isClient ? 'bg-moss-green/20 text-deep-ink' : 'bg-deep-ink/10 text-slate'
                      }`}
                    >
                      {isClient ? 'browser' : 'server'}
                    </span>
                  </div>
                  <p className="text-[11px] line-clamp-2 text-slate mb-1.5 leading-snug">{tool.description}</p>
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

        {/* Tool Execution Workbench */}
        <div className="sm:w-7/12 lg:w-8/12 flex-1 p-4 overflow-y-auto flex flex-col space-y-3.5 bg-white">
          {currentToolObj ? (
            <>
              {/* Header Row */}
              <div className="flex items-start justify-between gap-2 border-b border-deep-ink/10 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-sm font-bold text-deep-ink">{currentToolObj.name}</h3>
                    <Badge
                      variant="secondary"
                      className={`text-[9px] uppercase font-mono ${
                        currentToolObj.name.startsWith('client_')
                          ? 'bg-moss-green/20 text-deep-ink'
                          : 'bg-deep-ink/10 text-slate'
                      }`}
                    >
                      {currentToolObj.name.startsWith('client_') ? 'in-browser' : 'JSON-RPC 2.0'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate mt-1 leading-relaxed">{currentToolObj.description}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCurl}
                    className="text-[11px] h-7 rounded-full gap-1 px-2.5"
                    title="Copy as cURL command"
                  >
                    {copiedCurl ? <Check className="w-3 h-3 text-moss-green" /> : <Share2 className="w-3 h-3" />}
                    <span>{copiedCurl ? 'Copied' : 'cURL'}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectTool(currentToolObj)}
                    className="text-[11px] h-7 rounded-full text-slate hover:text-deep-ink px-2"
                    title="Reset to sample inputs"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {/* Parameter Schema Accordion */}
              {currentToolObj.inputSchema?.properties &&
                Object.keys(currentToolObj.inputSchema.properties).length > 0 && (
                  <div className="border border-deep-ink/10 rounded-2xl bg-canvas/40 overflow-hidden">
                    <button
                      onClick={() => setShowSchemaAccordion(prev => !prev)}
                      className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-deep-ink hover:bg-canvas transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-slate" />
                        <span>Parameters Schema ({Object.keys(currentToolObj.inputSchema.properties).length})</span>
                      </span>
                      {showSchemaAccordion ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate" />
                      )}
                    </button>

                    {showSchemaAccordion && (
                      <div className="p-3 border-t border-deep-ink/10 space-y-2 text-xs">
                        {Object.entries(currentToolObj.inputSchema.properties).map(([name, prop]: [string, any]) => {
                          const isRequired = currentToolObj.inputSchema?.required?.includes(name)
                          return (
                            <div
                              key={name}
                              className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 bg-white p-2.5 rounded-xl border border-deep-ink/5"
                            >
                              <div className="flex items-center gap-1.5 min-w-[140px]">
                                <span className="font-mono font-bold text-deep-ink text-[11px]">{name}</span>
                                {isRequired && (
                                  <span className="text-[9px] text-red-600 bg-red-50 px-1 rounded font-semibold">
                                    req
                                  </span>
                                )}
                                <span className="text-[10px] text-slate font-mono">({prop.type || 'any'})</span>
                              </div>
                              <span className="text-[11px] text-slate flex-1">
                                {prop.description || 'No description provided'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

              {/* Input Arguments Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate">
                    Input Arguments (JSON)
                  </label>
                  <button
                    onClick={handleFormatJson}
                    className="text-[10px] font-mono text-slate hover:text-deep-ink hover:underline cursor-pointer"
                  >
                    Beautify JSON
                  </button>
                </div>
                <textarea
                  value={toolInputJson}
                  onChange={e => setToolInputJson(e.target.value)}
                  rows={7}
                  className="w-full font-mono text-xs p-3 bg-canvas/30 border border-deep-ink/15 rounded-2xl focus:outline-none focus:ring-1 focus:ring-hi-yellow leading-relaxed text-deep-ink"
                  placeholder="{}"
                />
              </div>

              {/* Run Action Bar */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[10px] text-slate font-mono">Tip: Edit JSON payload above and press Execute</div>
                <Button
                  size="sm"
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-bold gap-1.5 px-4 h-8 shadow-xs cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isExecuting ? 'Executing...' : 'Execute Tool'}
                </Button>
              </div>

              {/* Output Console */}
              {executionResult && (
                <div className="space-y-1.5 pt-2 border-t border-deep-ink/10">
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
                        <Badge variant="outline" className="text-[10px] font-mono border-deep-ink/10">
                          {executionTimeMs} ms
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex bg-soft-meadow rounded-full p-0.5 text-[10px]">
                        <button
                          onClick={() => setResultViewMode('preview')}
                          className={`px-2 py-0.5 rounded-full cursor-pointer ${
                            resultViewMode === 'preview' ? 'bg-white font-bold text-deep-ink shadow-xs' : 'text-slate'
                          }`}
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => setResultViewMode('json')}
                          className={`px-2 py-0.5 rounded-full cursor-pointer ${
                            resultViewMode === 'json' ? 'bg-white font-bold text-deep-ink shadow-xs' : 'text-slate'
                          }`}
                        >
                          Raw JSON
                        </button>
                      </div>

                      <button
                        onClick={handleCopyResult}
                        className="text-slate hover:text-deep-ink text-xs flex items-center gap-1 cursor-pointer ml-1"
                      >
                        {copiedResult ? <Check className="w-3 h-3 text-moss-green" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedResult ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {resultViewMode === 'preview' && executionResult.content?.[0]?.text ? (
                    <div className="bg-canvas border border-deep-ink/10 p-3.5 rounded-2xl text-xs space-y-2 max-h-72 overflow-y-auto">
                      <div className="font-mono text-deep-ink whitespace-pre-wrap leading-relaxed">
                        {executionResult.content[0].text}
                      </div>
                    </div>
                  ) : (
                    <pre className="bg-deep-ink text-white font-mono text-[11px] p-3.5 rounded-2xl overflow-auto max-h-72 leading-relaxed selection:bg-hi-yellow selection:text-deep-ink">
                      {JSON.stringify(executionResult, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate text-xs space-y-2">
              <Terminal className="w-8 h-8 text-slate/40 mb-1" />
              <p className="font-semibold text-deep-ink">Select a tool to get started</p>
              <p className="max-w-xs text-[11px]">
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
