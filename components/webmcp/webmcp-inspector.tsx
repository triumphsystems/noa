'use client'

/**
 * WebMCP Developer Inspector & Playground
 * Interactive browser debugger for testing document.modelContext tools, resources, and prompts.
 */

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  X,
  Play,
  Database,
  FileText,
  Activity,
  Terminal,
  PlusCircle,
  Copy,
  Check,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useModelContext } from '@/lib/webmcp'
import type { ToolDefinition } from '@/lib/webmcp/core/types'

type InspectorTab = 'tools' | 'resources' | 'prompts' | 'state' | 'register'

export function WebMCPInspector() {
  const modelContext = useModelContext()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<InspectorTab>('tools')
  const [tools, setTools] = useState<ToolDefinition[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [toolInputJson, setToolInputJson] = useState<string>('{}')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  // Resource tester state
  const [resourceUri, setResourceUri] = useState('patient://patient-1')
  const [resourceResult, setResourceResult] = useState<any>(null)
  const [isReadingResource, setIsReadingResource] = useState(false)

  // Prompt tester state
  const [promptName, setPromptName] = useState('soap-note-generation')
  const [promptArgsJson, setPromptArgsJson] = useState('{"transcript": "Doctor: Hello John. Patient: I have a fever."}')
  const [promptResult, setPromptResult] = useState<any>(null)

  // Dynamic tool registration demo state
  const [customToolName, setCustomToolName] = useState('calculate_bmi')
  const [customToolDesc, setCustomToolDesc] = useState('Calculates Body Mass Index given weight in kg and height in cm')
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null)

  // Sync tools when modelContext is available
  useEffect(() => {
    if (!modelContext) return

    const refresh = () => {
      setTools(modelContext.listTools())
    }

    refresh()
    const timer = setInterval(refresh, 2000)
    return () => clearInterval(timer)
  }, [modelContext])

  // Keyboard shortcut: Ctrl + Shift + M
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-fill sample JSON when selecting a tool
  const handleSelectTool = (tool: ToolDefinition) => {
    setSelectedTool(tool.name)
    const sampleInput: Record<string, any> = {}
    if (tool.inputSchema?.properties) {
      Object.entries(tool.inputSchema.properties).forEach(([key, prop]) => {
        if (key === 'transcript') {
          sampleInput[key] = 'Doctor: How can I help you today? Patient: I have had a severe dry cough for three days.'
        } else if (key === 'patientId') {
          sampleInput[key] = 'patient-1'
        } else if (key === 'doctorId') {
          sampleInput[key] = 'doctor-1'
        } else if (key === 'sessionId') {
          sampleInput[key] = 'session-1'
        } else if (key === 'soapNote') {
          sampleInput[key] = 'SUBJECTIVE: Patient has cough. ASSESSMENT: Acute bronchitis. PLAN: Rest and hydration.'
        } else if (key === 'chiefComplaint') {
          sampleInput[key] = 'Shortness of breath'
        } else if (key === 'symptoms') {
          sampleInput[key] = 'Chest tightness and wheezing on exertion'
        } else if (prop.type === 'string') {
          sampleInput[key] = `sample_${key}`
        } else if (prop.type === 'number') {
          sampleInput[key] = 0
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

  // Execute tool
  const handleExecuteTool = async () => {
    if (!modelContext || !selectedTool) return
    setIsExecuting(true)
    setExecutionResult(null)
    const start = performance.now()

    try {
      let parsed = {}
      try {
        parsed = JSON.parse(toolInputJson)
      } catch {
        throw new Error('Input is not valid JSON')
      }

      const result = await modelContext.executeTool(selectedTool, parsed)
      setExecutionTimeMs(Math.round(performance.now() - start))
      setExecutionResult(result)
    } catch (err: any) {
      setExecutionTimeMs(Math.round(performance.now() - start))
      setExecutionResult({ error: err?.message || String(err) })
    } finally {
      setIsExecuting(false)
    }
  }

  // Read resource
  const handleReadResource = async () => {
    if (!modelContext) return
    setIsReadingResource(true)
    setResourceResult(null)

    try {
      const result = await modelContext.readResource(resourceUri)
      setResourceResult(result)
    } catch (err: any) {
      setResourceResult({ error: err?.message || String(err) })
    } finally {
      setIsReadingResource(false)
    }
  }

  // Get prompt
  const handleGetPrompt = async () => {
    if (!modelContext) return
    try {
      const args = JSON.parse(promptArgsJson || '{}')
      const result = await modelContext.getPrompt(promptName, args)
      setPromptResult(result)
    } catch (err: any) {
      setPromptResult({ error: err?.message || String(err) })
    }
  }

  // Register custom tool dynamically
  const handleRegisterCustomTool = () => {
    if (!modelContext || !customToolName) return

    modelContext.registerTool({
      name: customToolName,
      description: customToolDesc,
      inputSchema: {
        type: 'object',
        properties: {
          weightKg: { type: 'number', description: 'Weight in kilograms' },
          heightCm: { type: 'number', description: 'Height in centimeters' },
        },
        required: ['weightKg', 'heightCm'],
      },
      execute: async (input: { weightKg?: number; heightCm?: number }) => {
        const weight = Number(input.weightKg || 70)
        const heightM = Number(input.heightCm || 175) / 100
        const bmi = (weight / (heightM * heightM)).toFixed(1)
        let category = 'Normal weight'
        if (Number(bmi) < 18.5) category = 'Underweight'
        else if (Number(bmi) >= 25 && Number(bmi) < 30) category = 'Overweight'
        else if (Number(bmi) >= 30) category = 'Obesity'

        return {
          bmi: Number(bmi),
          category,
          evaluatedAt: new Date().toISOString(),
          registeredVia: 'document.modelContext.registerTool',
        }
      },
    })

    setRegistrationSuccess(`Successfully registered tool: "${customToolName}" into document.modelContext!`)
    setTools(modelContext.listTools())
    setTimeout(() => setRegistrationSuccess(null), 5000)
  }

  const filteredTools = tools.filter(
    t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const copyResult = () => {
    if (!executionResult) return
    navigator.clipboard.writeText(JSON.stringify(executionResult, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Floating Trigger Badge */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-deep-ink text-white shadow-xl hover:bg-deep-ink/90 transition-all border border-hi-yellow/30 text-xs font-semibold group cursor-pointer"
          title="Toggle WebMCP Inspector (Ctrl + Shift + M)"
        >
          <span className="w-2 h-2 rounded-full bg-moss-green animate-pulse" />
          <Sparkles className="w-3.5 h-3.5 text-hi-yellow" />
          <span>WebMCP</span>
          <Badge className="bg-hi-yellow text-deep-ink text-[10px] px-1.5 py-0 h-4 font-bold rounded-full">
            {tools.length}
          </Badge>
        </button>
      </div>

      {/* Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-deep-ink/30 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-Over Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] md:w-[560px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-deep-ink/10 flex items-center justify-between bg-canvas">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-hi-yellow/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-deep-ink" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-deep-ink text-base">WebMCP Inspector</h2>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  v2024-11-05
                </Badge>
              </div>
              <p className="text-slate text-xs">document.modelContext & /api/mcp</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] text-slate bg-soft-meadow rounded border border-deep-ink/10">
              Ctrl+Shift+M
            </kbd>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-soft-meadow text-slate hover:text-deep-ink transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-deep-ink/10 px-4 bg-white overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'tools'
                ? 'border-hi-yellow text-deep-ink font-bold'
                : 'border-transparent text-slate hover:text-deep-ink'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Tools ({tools.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'resources'
                ? 'border-hi-yellow text-deep-ink font-bold'
                : 'border-transparent text-slate hover:text-deep-ink'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Resources</span>
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'prompts'
                ? 'border-hi-yellow text-deep-ink font-bold'
                : 'border-transparent text-slate hover:text-deep-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Prompts</span>
          </button>
          <button
            onClick={() => setActiveTab('state')}
            className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'state'
                ? 'border-hi-yellow text-deep-ink font-bold'
                : 'border-transparent text-slate hover:text-deep-ink'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Client State</span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'register'
                ? 'border-hi-yellow text-deep-ink font-bold'
                : 'border-transparent text-slate hover:text-deep-ink'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-moss-green" />
            <span>Register Tool</span>
          </button>
        </div>

        {/* Tab 1: Tools Explorer & Playground */}
        {activeTab === 'tools' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="p-3 border-b border-deep-ink/10 bg-canvas/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate" />
                <input
                  type="text"
                  placeholder="Filter tools..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-deep-ink/15 rounded-full focus:outline-none focus:ring-1 focus:ring-hi-yellow"
                />
              </div>
            </div>

            {/* Split Screen: Tool List & Runner */}
            <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
              {/* Tool List Sidebar */}
              <div className="sm:w-1/2 border-r border-deep-ink/10 overflow-y-auto p-2 space-y-1 max-h-52 sm:max-h-none">
                {filteredTools.map(tool => {
                  const isClient = tool.name.startsWith('client_')
                  return (
                    <button
                      key={tool.name}
                      onClick={() => handleSelectTool(tool)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all text-xs cursor-pointer ${
                        selectedTool === tool.name
                          ? 'bg-hi-yellow text-deep-ink shadow-xs font-medium'
                          : 'hover:bg-soft-meadow/70 text-slate hover:text-deep-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-mono font-semibold text-deep-ink truncate">{tool.name}</span>
                        {isClient ? (
                          <span className="text-[9px] px-1.5 py-0.2 bg-moss-green/20 text-deep-ink rounded font-bold uppercase">
                            browser
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 bg-deep-ink/10 text-slate rounded uppercase">
                            server
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] line-clamp-2 opacity-80">{tool.description}</p>
                    </button>
                  )
                })}
              </div>

              {/* Tool Runner Area */}
              <div className="sm:w-1/2 flex-1 p-3 overflow-y-auto flex flex-col space-y-3 bg-canvas/30">
                {selectedTool ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-deep-ink truncate">{selectedTool}</span>
                      <Button
                        size="sm"
                        onClick={handleExecuteTool}
                        disabled={isExecuting}
                        className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-bold gap-1 px-3 py-1 h-7"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        {isExecuting ? 'Running...' : 'Execute'}
                      </Button>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-slate block mb-1">
                        Input Arguments (JSON)
                      </label>
                      <textarea
                        value={toolInputJson}
                        onChange={e => setToolInputJson(e.target.value)}
                        rows={6}
                        className="w-full font-mono text-xs p-2.5 bg-white border border-deep-ink/15 rounded-xl focus:outline-none focus:ring-1 focus:ring-hi-yellow resize-none"
                      />
                    </div>

                    {/* Result Display */}
                    {executionResult && (
                      <div className="flex-1 flex flex-col space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate flex items-center gap-1.5">
                            Output
                            {executionTimeMs !== null && (
                              <Badge variant="outline" className="text-[9px] font-mono">
                                {executionTimeMs}ms
                              </Badge>
                            )}
                          </span>
                          <button
                            onClick={copyResult}
                            className="text-slate hover:text-deep-ink text-xs flex items-center gap-1 cursor-pointer"
                          >
                            {copied ? <Check className="w-3 h-3 text-moss-green" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="flex-1 bg-deep-ink text-white font-mono text-[11px] p-3 rounded-xl overflow-auto max-h-56 leading-relaxed">
                          {JSON.stringify(executionResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-6 text-slate text-xs">
                    Select a tool from the left to inspect its schema and execute it live.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Resources Explorer */}
        {activeTab === 'resources' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-deep-ink">Resource URI (RFC 6570)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resourceUri}
                  onChange={e => setResourceUri(e.target.value)}
                  placeholder="patient://patient-1"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-deep-ink/20 rounded-full font-mono focus:outline-none focus:ring-1 focus:ring-hi-yellow"
                />
                <Button
                  onClick={handleReadResource}
                  disabled={isReadingResource}
                  className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-bold px-4"
                >
                  {isReadingResource ? 'Reading...' : 'Read'}
                </Button>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate font-bold">Quick Examples:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'patient://patient-1',
                  'patient://patient-1/history',
                  'doctor://doctor-1',
                  'doctor://doctor-1/dashboard',
                  'session://session-1',
                  'session://session-1/transcript',
                  'soap://session-1',
                  'intake://patient-1',
                  'stats://doctor/doctor-1',
                ].map(uri => (
                  <button
                    key={uri}
                    onClick={() => {
                      setResourceUri(uri)
                    }}
                    className="text-[11px] font-mono px-2.5 py-1 bg-soft-meadow rounded-full hover:bg-hi-yellow/50 text-deep-ink transition-colors cursor-pointer"
                  >
                    {uri}
                  </button>
                ))}
              </div>
            </div>

            {resourceResult && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate">Resource Content:</span>
                <pre className="bg-deep-ink text-white font-mono text-[11px] p-3 rounded-xl overflow-auto max-h-80 leading-relaxed">
                  {JSON.stringify(resourceResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Prompts Library */}
        {activeTab === 'prompts' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-deep-ink">Select Clinical Prompt</label>
              <select
                value={promptName}
                onChange={e => setPromptName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-deep-ink/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-hi-yellow font-mono"
              >
                <option value="soap-note-generation">soap-note-generation</option>
                <option value="clinical-insights">clinical-insights</option>
                <option value="patient-summary">patient-summary</option>
                <option value="triage-assessment">triage-assessment</option>
                <option value="intake-conversation-turn">intake-conversation-turn</option>
                <option value="follow-up-care-plan">follow-up-care-plan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-deep-ink">Prompt Arguments (JSON)</label>
              <textarea
                value={promptArgsJson}
                onChange={e => setPromptArgsJson(e.target.value)}
                rows={3}
                className="w-full font-mono text-xs p-2.5 bg-white border border-deep-ink/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-hi-yellow resize-none"
              />
            </div>

            <Button
              onClick={handleGetPrompt}
              className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-bold px-4"
            >
              Evaluate Prompt Template
            </Button>

            {promptResult && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate">Evaluated Prompt Messages:</span>
                <pre className="bg-deep-ink text-white font-mono text-[11px] p-3 rounded-xl overflow-auto max-h-72 leading-relaxed">
                  {JSON.stringify(promptResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Live Client State */}
        {activeTab === 'state' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div>
              <h3 className="font-serif font-bold text-sm text-deep-ink mb-1">Live In-Memory Zustand Store</h3>
              <p className="text-xs text-slate">
                Direct snapshot accessed via <code className="bg-soft-meadow px-1 py-0.5 rounded font-mono">document.modelContext.clientState</code>
              </p>
            </div>

            <pre className="bg-canvas border border-deep-ink/10 text-deep-ink font-mono text-xs p-4 rounded-2xl overflow-auto leading-relaxed">
              {JSON.stringify(modelContext?.clientState || {}, null, 2)}
            </pre>

            <div className="space-y-2 pt-2 border-t border-deep-ink/10">
              <span className="text-xs font-bold text-deep-ink">Execute Browser Actions Directly:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => modelContext?.executeTool('client_start_recording')}
                  className="rounded-full text-xs"
                >
                  Start Recording
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => modelContext?.executeTool('client_stop_recording')}
                  className="rounded-full text-xs"
                >
                  Stop Recording
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    modelContext?.executeTool('client_append_transcript', {
                      text: '[Agent injected live clinical finding]',
                    })
                  }
                  className="rounded-full text-xs"
                >
                  Append Sample Transcript
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Dynamic Tool Registration Form */}
        {activeTab === 'register' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div>
              <h3 className="font-serif font-bold text-sm text-deep-ink mb-1">Dynamic Tool Registration Demo</h3>
              <p className="text-xs text-slate">
                Register a new tool dynamically at runtime using <code className="bg-soft-meadow px-1 py-0.5 rounded font-mono">document.modelContext.registerTool(&#123;...&#125;)</code>.
              </p>
            </div>

            {registrationSuccess && (
              <div className="p-3 bg-moss-green/15 border border-moss-green/30 rounded-2xl text-xs font-semibold text-deep-ink flex items-center gap-2">
                <Check className="w-4 h-4 text-moss-green shrink-0" />
                <span>{registrationSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-deep-ink block mb-1">Tool Name</label>
                <input
                  type="text"
                  value={customToolName}
                  onChange={e => setCustomToolName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-deep-ink/20 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-hi-yellow"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-deep-ink block mb-1">Description</label>
                <input
                  type="text"
                  value={customToolDesc}
                  onChange={e => setCustomToolDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-deep-ink/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-hi-yellow"
                />
              </div>

              <div className="p-3 bg-canvas rounded-2xl border border-deep-ink/10 text-xs text-slate space-y-1">
                <span className="font-semibold text-deep-ink block">Implementation:</span>
                <p className="text-[11px] font-mono leading-relaxed">
                  input: &#123; weightKg, heightCm &#125; &rarr; returns BMI & category
                </p>
              </div>

              <Button
                onClick={handleRegisterCustomTool}
                className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-bold py-2.5"
              >
                Call document.modelContext.registerTool()
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
