'use client'

/**
 * WebMCP Developer Inspector & Studio
 * Interactive browser workbench for inspecting, testing, and debugging
 * document.modelContext tools, resources, prompts, and real-time state.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  RefreshCw,
  Clock,
  Mic,
  Square,
  MessageSquare,
  Trash2,
  Code,
  Share2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useModelContext } from '@/lib/webmcp'
import type { ToolDefinition, ResourceDefinition, PromptDefinition } from '@/lib/webmcp/core/types'

type InspectorTab = 'tools' | 'resources' | 'prompts' | 'state' | 'register' | 'activity'
type ToolCategory = 'all' | 'clinical' | 'records' | 'database' | 'browser'

interface ActivityItem {
  id: string
  timestamp: string
  type: 'tool' | 'resource' | 'prompt' | 'register' | 'action'
  target: string
  durationMs?: number
  status: 'success' | 'error'
  input?: any
  output?: any
}

// Built-in prompt presets with default arguments
const PROMPT_PRESETS: Record<string, { label: string; description: string; defaultArgs: Record<string, string> }> = {
  'soap-note-generation': {
    label: 'SOAP Note Generation',
    description: 'Generates structured clinical SOAP documentation from consultation transcript',
    defaultArgs: {
      transcript: 'Doctor: Good morning John, what brings you in today?\nPatient: I have had persistent dry cough and slight fever for 3 days.\nDoctor: Any shortness of breath or chest pain?\nPatient: Mild chest tightness when coughing, but no acute pain.',
      patientContext: 'John Doe, 48yo male, non-smoker, history of mild seasonal allergies.',
    },
  },
  'clinical-insights': {
    label: 'Clinical Insights & Differential',
    description: 'Deep clinical reasoning, differential diagnosis, and diagnostic workup recommendations',
    defaultArgs: {
      patientHistory: '48yo male, hypertension treated with Lisinopril 10mg.',
      currentPresentation: 'Persistent dry cough x 3 days, low grade fever (38.1C), mild wheeze on expiration.',
      previousFindings: 'Chest X-ray 6 months ago was clear. Normal baseline renal panel.',
    },
  },
  'patient-summary': {
    label: 'Patient-Friendly Summary',
    description: 'Translates complex medical SOAP notes into plain, reassuring patient instructions',
    defaultArgs: {
      soapNote: 'ASSESSMENT: Acute viral bronchitis. Prescribed albuterol MDI 2 puffs q4h prn. PLAN: Hydration, rest, return if dyspnea worsens.',
    },
  },
  'triage-assessment': {
    label: 'Triage Urgency Assessment',
    description: 'Evaluates chief complaint and symptoms to assign clinical triage priority',
    defaultArgs: {
      chiefComplaint: 'Shortness of breath and wheezing',
      symptoms: 'Patient reports progressive dyspnea since yesterday evening, audible expiratory wheeze, spoke in short sentences.',
    },
  },
  'intake-conversation-turn': {
    label: 'Intake Assistant Turn',
    description: 'Conversational intake AI generating empathetic questions based on patient responses',
    defaultArgs: {
      conversationHistory: 'AI: Welcome! Could you tell me what symptoms you are experiencing today?\nPatient: My lower back has been aching since I lifted heavy boxes yesterday.',
      currentAnswer: 'The pain is worse when bending forward and radiates slightly to my left hip.',
    },
  },
  'follow-up-care-plan': {
    label: 'Follow-Up Care Plan',
    description: 'Synthesizes discharge instructions, red flags, and follow-up milestones',
    defaultArgs: {
      assessment: 'Acute lumbosacral muscle strain with mild left gluteal radiation.',
      medications: 'Ibuprofen 400mg TID with food, Cyclobenzaprine 5mg QHS prn spasms.',
    },
  },
}

// Custom tool registration templates
const TOOL_PRESETS = [
  {
    id: 'bmi',
    name: 'calculate_bmi',
    desc: 'Calculate Body Mass Index (BMI) and categorization given weight (kg) and height (cm)',
    params: {
      weightKg: { type: 'number', description: 'Weight in kilograms (e.g. 70)' },
      heightCm: { type: 'number', description: 'Height in centimeters (e.g. 175)' },
    },
    code: `const weight = Number(input.weightKg || 70)
const heightM = Number(input.heightCm || 175) / 100
const bmi = Number((weight / (heightM * heightM)).toFixed(1))
let category = 'Normal weight'
if (bmi < 18.5) category = 'Underweight'
else if (bmi >= 25 && bmi < 30) category = 'Overweight'
else if (bmi >= 30) category = 'Obesity'
return { bmi, category, classification: category, normalRange: '18.5 - 24.9' }`,
  },
  {
    id: 'map',
    name: 'calculate_map',
    desc: 'Calculate Mean Arterial Pressure (MAP) from systolic and diastolic blood pressure',
    params: {
      systolic: { type: 'number', description: 'Systolic blood pressure (mmHg)' },
      diastolic: { type: 'number', description: 'Diastolic blood pressure (mmHg)' },
    },
    code: `const sbp = Number(input.systolic || 120)
const dbp = Number(input.diastolic || 80)
const map = Number(((2 * dbp + sbp) / 3).toFixed(1))
const isPerfusionAdequate = map >= 65
return { map, unit: 'mmHg', adequatePerfusion: isPerfusionAdequate, target: '>= 65 mmHg' }`,
  },
  {
    id: 'egfr',
    name: 'estimate_egfr_ckd_epi',
    desc: 'Estimate glomerular filtration rate (eGFR) using CKD-EPI equation',
    params: {
      creatinine: { type: 'number', description: 'Serum creatinine (mg/dL)' },
      age: { type: 'number', description: 'Patient age in years' },
      isFemale: { type: 'boolean', description: 'True if female, false if male' },
    },
    code: `const cr = Number(input.creatinine || 1.0)
const age = Number(input.age || 50)
const isFemale = Boolean(input.isFemale)
const k = isFemale ? 0.7 : 0.9
const a = isFemale ? -0.241 : -0.302
const min = Math.min(cr / k, 1)
const max = Math.max(cr / k, 1)
const egfr = Math.round(142 * Math.pow(min, a) * Math.pow(max, -1.200) * Math.pow(0.9938, age) * (isFemale ? 1.012 : 1.0))
let stage = 'G1 (Normal or high)'
if (egfr < 15) stage = 'G5 (Kidney failure)'
else if (egfr < 30) stage = 'G4 (Severely decreased)'
else if (egfr < 60) stage = 'G3 (Moderately decreased)'
else if (egfr < 90) stage = 'G2 (Mildly decreased)'
return { egfr, stage, unit: 'mL/min/1.73m²' }`,
  },
]

export function WebMCPInspector() {
  const modelContext = useModelContext()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<InspectorTab>('tools')
  const [toolCategory, setToolCategory] = useState<ToolCategory>('all')

  // Tool explorer state
  const [tools, setTools] = useState<ToolDefinition[]>([])
  const [resources, setResources] = useState<ResourceDefinition[]>([])
  const [prompts, setPrompts] = useState<PromptDefinition[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [toolInputJson, setToolInputJson] = useState<string>('{}')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null)
  const [showSchemaAccordion, setShowSchemaAccordion] = useState(true)
  const [resultViewMode, setResultViewMode] = useState<'preview' | 'json'>('preview')
  const [copiedResult, setCopiedResult] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)

  // Resource tester state
  const [resourceUri, setResourceUri] = useState('patient://patient-1')
  const [resourceResult, setResourceResult] = useState<any>(null)
  const [isReadingResource, setIsReadingResource] = useState(false)
  const [resourceTimeMs, setResourceTimeMs] = useState<number | null>(null)

  // Prompt tester state
  const [selectedPromptKey, setSelectedPromptKey] = useState<string>('soap-note-generation')
  const [promptArgs, setPromptArgs] = useState<Record<string, string>>(
    PROMPT_PRESETS['soap-note-generation']?.defaultArgs || {}
  )
  const [isEvaluatingPrompt, setIsEvaluatingPrompt] = useState(false)
  const [promptResult, setPromptResult] = useState<any>(null)
  const [promptTimeMs, setPromptTimeMs] = useState<number | null>(null)

  // Custom tool registration state
  const [selectedPresetId, setSelectedPresetId] = useState('bmi')
  const [customToolName, setCustomToolName] = useState(TOOL_PRESETS[0].name)
  const [customToolDesc, setCustomToolDesc] = useState(TOOL_PRESETS[0].desc)
  const [customToolCode, setCustomToolCode] = useState(TOOL_PRESETS[0].code)
  const [registrationNotice, setRegistrationNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Activity stream state
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  // Sync tools, resources, and prompts
  const refreshRegistry = useCallback(async () => {
    if (!modelContext) return
    setIsSyncing(true)
    try {
      if ('syncServerDefinitions' in modelContext && typeof (modelContext as any).syncServerDefinitions === 'function') {
        await (modelContext as any).syncServerDefinitions()
      }
      setTools(modelContext.listTools())
      setResources(modelContext.listResources())
      setPrompts(modelContext.listPrompts())
    } catch {
      // Fallback local list
      setTools(modelContext.listTools())
      setResources(modelContext.listResources())
      setPrompts(modelContext.listPrompts())
    } finally {
      setIsSyncing(false)
    }
  }, [modelContext])

  useEffect(() => {
    refreshRegistry()
    const timer = setInterval(refreshRegistry, 5000)
    return () => clearInterval(timer)
  }, [refreshRegistry])

  // Select initial tool if none selected
  useEffect(() => {
    if (tools.length > 0 && !selectedTool) {
      handleSelectTool(tools[0])
    }
  }, [tools, selectedTool])

  // Keyboard shortcut: Ctrl + Shift + M
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault()
        setIsOpen(prev => !prev)
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Add activity item
  const logActivity = (item: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newItem: ActivityItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
    setActivityLog(prev => [newItem, ...prev.slice(0, 49)])
  }

  // Auto-fill sample JSON when selecting a tool
  const handleSelectTool = (tool: ToolDefinition) => {
    setSelectedTool(tool.name)
    const sampleInput: Record<string, any> = {}

    if (tool.inputSchema?.properties) {
      Object.entries(tool.inputSchema.properties).forEach(([key, prop]) => {
        if (key === 'transcript') {
          sampleInput[key] = 'Doctor: Hello John, how are you feeling today?\nPatient: I have had persistent dry cough and mild fever for three days.\nDoctor: Any difficulty breathing?\nPatient: Only mild chest tightness.'
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
          sampleInput[key] = 'SUBJECTIVE: Patient reports worsening asthma symptoms. ASSESSMENT: Mild acute exacerbation. PLAN: Inhaled corticosteroid step-up.'
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

  // Execute selected tool
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
        throw new Error('Input argument is not valid JSON')
      }

      const result = await modelContext.executeTool(selectedTool, parsed)
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

  // Read resource
  const handleReadResource = async (uriToRead?: string) => {
    if (!modelContext) return
    const uri = uriToRead || resourceUri
    setIsReadingResource(true)
    setResourceResult(null)
    const start = performance.now()

    try {
      const result = await modelContext.readResource(uri)
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

  // Evaluate prompt
  const handleEvaluatePrompt = async () => {
    if (!modelContext) return
    setIsEvaluatingPrompt(true)
    setPromptResult(null)
    const start = performance.now()

    try {
      const result = await modelContext.getPrompt(selectedPromptKey, promptArgs)
      const duration = Math.round(performance.now() - start)
      setPromptTimeMs(duration)
      setPromptResult(result)

      logActivity({
        type: 'prompt',
        target: selectedPromptKey,
        durationMs: duration,
        status: 'success',
        input: promptArgs,
        output: result,
      })
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      setPromptTimeMs(duration)
      const errorObj = { error: err?.message || String(err) }
      setPromptResult(errorObj)

      logActivity({
        type: 'prompt',
        target: selectedPromptKey,
        durationMs: duration,
        status: 'error',
        input: promptArgs,
        output: errorObj,
      })
    } finally {
      setIsEvaluatingPrompt(false)
    }
  }

  // Register custom tool
  const handleRegisterCustomTool = () => {
    if (!modelContext || !customToolName) return

    try {
      const preset = TOOL_PRESETS.find(p => p.id === selectedPresetId)
      const properties = preset ? preset.params : { input: { type: 'string' } }

      // Safe evaluation of the tool execution function
      // eslint-disable-next-line no-new-func
      const execFn = new Function('input', customToolCode)

      modelContext.registerTool({
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

      refreshRegistry()
      setTimeout(() => setRegistrationNotice(null), 6000)
    } catch (err: any) {
      setRegistrationNotice({
        type: 'error',
        message: `Registration failed: ${err?.message || String(err)}`,
      })
    }
  }

  // Copy helpers
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

  // Format JSON helper
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(toolInputJson)
      setToolInputJson(JSON.stringify(parsed, null, 2))
    } catch {
      // Ignore if invalid
    }
  }

  // Filter tools
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

  const clientState = modelContext?.clientState as any

  return (
    <>
      {/* Floating Launcher Pill */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-deep-ink text-white shadow-2xl hover:bg-deep-ink/90 transition-all border border-hi-yellow/40 hover:scale-105 active:scale-95 group cursor-pointer"
          title="Toggle WebMCP Inspector (Ctrl + Shift + M)"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moss-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-moss-green" />
          </span>
          <Sparkles className="w-4 h-4 text-hi-yellow transition-transform group-hover:rotate-12" />
          <span className="font-semibold text-xs tracking-wide">WebMCP Studio</span>
          <Badge className="bg-hi-yellow text-deep-ink text-[10px] px-2 py-0.5 h-4 font-mono font-bold rounded-full border-none">
            {tools.length}
          </Badge>
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-deep-ink/40 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-Over Inspector Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 ease-in-out border-l border-deep-ink/10 ${
          isExpanded ? 'w-full sm:w-[94vw] lg:w-[1150px]' : 'w-full sm:w-[620px] lg:w-[700px]'
        } ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Studio Header */}
        <div className="p-4 border-b border-deep-ink/10 bg-canvas flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-deep-ink flex items-center justify-center text-hi-yellow shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-deep-ink text-base">WebMCP Studio</h2>
                <Badge variant="outline" className="text-[10px] font-mono bg-white border-deep-ink/15 text-deep-ink">
                  v2024-11-05
                </Badge>
                <div className="flex items-center gap-1 text-[11px] text-moss-green font-medium">
                  <span className="w-2 h-2 rounded-full bg-moss-green inline-block animate-pulse" />
                  <span className="text-[11px] text-slate font-sans">Ready</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate mt-0.5 font-mono">
                <span>document.modelContext</span>
                <span>•</span>
                <span>/api/mcp</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={refreshRegistry}
              disabled={isSyncing}
              className="p-2 rounded-xl text-slate hover:text-deep-ink hover:bg-soft-meadow transition-colors cursor-pointer"
              title="Sync tools and resources from server"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-hi-yellow' : ''}`} />
            </button>

            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className="p-2 rounded-xl text-slate hover:text-deep-ink hover:bg-soft-meadow transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse drawer width' : 'Maximize workbench width'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-mono text-slate bg-soft-meadow rounded-lg border border-deep-ink/10">
              Ctrl+Shift+M
            </kbd>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate hover:text-deep-ink hover:bg-soft-meadow transition-colors cursor-pointer"
              title="Close Inspector (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-deep-ink/10 px-3 bg-white overflow-x-auto gap-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'tools'
                ? 'border-hi-yellow text-deep-ink font-bold'
                : 'border-transparent text-slate hover:text-deep-ink'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Tools</span>
            <Badge className="bg-soft-meadow text-deep-ink text-[10px] px-1.5 py-0 h-4 font-mono font-bold rounded-full border-none">
              {tools.length}
            </Badge>
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
            <Badge className="bg-soft-meadow text-deep-ink text-[10px] px-1.5 py-0 h-4 font-mono font-bold rounded-full border-none">
              {resources.length}
            </Badge>
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
            <Badge className="bg-soft-meadow text-deep-ink text-[10px] px-1.5 py-0 h-4 font-mono font-bold rounded-full border-none">
              {prompts.length || Object.keys(PROMPT_PRESETS).length}
            </Badge>
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
            {clientState?.isRecording && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
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

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors shrink-0 cursor-pointer ml-auto ${
              activeTab === 'activity'
                ? 'border-hi-yellow text-deep-ink font-bold'
                : 'border-transparent text-slate hover:text-deep-ink'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Activity</span>
            {activityLog.length > 0 && (
              <Badge className="bg-deep-ink text-hi-yellow text-[10px] px-1.5 py-0 h-4 font-mono rounded-full border-none">
                {activityLog.length}
              </Badge>
            )}
          </button>
        </div>

        {/* Tab 1: Tools Explorer & Playground */}
        {activeTab === 'tools' && (
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
                          <span>{propCount} parameter{propCount === 1 ? '' : 's'}</span>
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
                            {showSchemaAccordion ? <ChevronDown className="w-3.5 h-3.5 text-slate" /> : <ChevronRight className="w-3.5 h-3.5 text-slate" />}
                          </button>

                          {showSchemaAccordion && (
                            <div className="p-3 border-t border-deep-ink/10 space-y-2 text-xs">
                              {Object.entries(currentToolObj.inputSchema.properties).map(([name, prop]: [string, any]) => {
                                const isRequired = currentToolObj.inputSchema?.required?.includes(name)
                                return (
                                  <div key={name} className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 bg-white p-2.5 rounded-xl border border-deep-ink/5">
                                    <div className="flex items-center gap-1.5 min-w-[140px]">
                                      <span className="font-mono font-bold text-deep-ink text-[11px]">{name}</span>
                                      {isRequired && (
                                        <span className="text-[9px] text-red-600 bg-red-50 px-1 rounded font-semibold">
                                          req
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate font-mono">({prop.type || 'any'})</span>
                                    </div>
                                    <span className="text-[11px] text-slate flex-1">{prop.description || 'No description provided'}</span>
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
                      <div className="text-[10px] text-slate font-mono">
                        Tip: Edit JSON payload above and press Execute
                      </div>
                      <Button
                        size="sm"
                        onClick={handleExecuteTool}
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
                      Choose any clinical AI, database, or browser action tool from the list on the left to inspect its schema and execute it live.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Resources Explorer */}
        {activeTab === 'resources' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-white">
            <div>
              <h3 className="font-serif font-bold text-sm text-deep-ink">RFC 6570 Resource Explorer</h3>
              <p className="text-xs text-slate mt-0.5">
                Inspect structured healthcare data records directly over Model Context Protocol URI schemes.
              </p>
            </div>

            {/* URI Input Bar */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-deep-ink block">Resource URI</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resourceUri}
                  onChange={e => setResourceUri(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReadResource()}
                  placeholder="patient://patient-1"
                  className="flex-1 px-3.5 py-2 text-xs bg-canvas/30 border border-deep-ink/20 rounded-full font-mono focus:outline-none focus:ring-1 focus:ring-hi-yellow text-deep-ink"
                />
                <Button
                  onClick={() => handleReadResource()}
                  disabled={isReadingResource}
                  className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-bold px-5 cursor-pointer shadow-xs"
                >
                  {isReadingResource ? 'Reading...' : 'Read'}
                </Button>
              </div>
            </div>

            {/* Quick URI Template Cards */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-slate font-bold">Quick Resource Templates:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { uri: 'patient://patient-1', label: 'Patient Record', desc: 'Demographics, medical conditions, allergies' },
                  { uri: 'patient://patient-1/history', label: 'Medical History', desc: 'Prior surgeries, medications, clinical notes' },
                  { uri: 'doctor://doctor-1', label: 'Doctor Profile', desc: 'Credentials, specialty, clinic affiliation' },
                  { uri: 'doctor://doctor-1/dashboard', label: 'Doctor Dashboard', desc: 'Recent patient queue & active consultations' },
                  { uri: 'session://session-1', label: 'Consultation Session', desc: 'Status, startedAt, duration, metadata' },
                  { uri: 'session://session-1/transcript', label: 'Live Transcript', desc: 'Voice transcription dialogue turns' },
                  { uri: 'soap://session-1', label: 'SOAP Note Document', desc: 'Subjective, Objective, Assessment, Plan' },
                  { uri: 'intake://patient-1', label: 'Patient Intake Form', desc: 'Pre-visit questionnaire answers' },
                ].map(item => (
                  <button
                    key={item.uri}
                    onClick={() => {
                      setResourceUri(item.uri)
                      handleReadResource(item.uri)
                    }}
                    className="text-left p-2.5 rounded-2xl bg-canvas hover:bg-soft-meadow border border-deep-ink/5 hover:border-deep-ink/15 transition-all text-xs cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-deep-ink text-xs">{item.label}</span>
                      <span className="text-[10px] font-mono text-slate group-hover:text-deep-ink">Read &rarr;</span>
                    </div>
                    <p className="font-mono text-[10px] text-deep-ink/70 truncate">{item.uri}</p>
                    <p className="text-[10px] text-slate mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Resource Output Viewer */}
            {resourceResult && (
              <div className="space-y-2 pt-2 border-t border-deep-ink/10">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-moss-green" />
                    <span className="font-bold text-deep-ink">Resource Content</span>
                    {resourceTimeMs !== null && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {resourceTimeMs} ms
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(resourceResult, null, 2))
                    }}
                    className="text-slate hover:text-deep-ink text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>

                <pre className="bg-deep-ink text-white font-mono text-[11px] p-4 rounded-2xl overflow-auto max-h-80 leading-relaxed">
                  {JSON.stringify(resourceResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Prompts Library */}
        {activeTab === 'prompts' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-white">
            <div>
              <h3 className="font-serif font-bold text-sm text-deep-ink">Clinical Prompt Templates</h3>
              <p className="text-xs text-slate mt-0.5">
                Evaluate prompt templates configured for Nova AI models with live clinical variables.
              </p>
            </div>

            {/* Prompt Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-deep-ink block">Select Clinical Prompt</label>
              <select
                value={selectedPromptKey}
                onChange={e => {
                  const key = e.target.value
                  setSelectedPromptKey(key)
                  setPromptArgs(PROMPT_PRESETS[key]?.defaultArgs || {})
                  setPromptResult(null)
                }}
                className="w-full px-3.5 py-2 text-xs bg-canvas/30 border border-deep-ink/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-hi-yellow font-mono text-deep-ink cursor-pointer"
              >
                {Object.entries(PROMPT_PRESETS).map(([key, def]) => (
                  <option key={key} value={key}>
                    {key} — {def.label}
                  </option>
                ))}
              </select>
              {PROMPT_PRESETS[selectedPromptKey] && (
                <p className="text-xs text-slate">{PROMPT_PRESETS[selectedPromptKey].description}</p>
              )}
            </div>

            {/* Prompt Variables Form */}
            <div className="space-y-3 bg-canvas/40 p-4 rounded-2xl border border-deep-ink/10">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate">
                  Prompt Arguments
                </label>
                <button
                  onClick={() => setPromptArgs(PROMPT_PRESETS[selectedPromptKey]?.defaultArgs || {})}
                  className="text-[10px] text-slate hover:text-deep-ink hover:underline cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>

              {Object.keys(promptArgs).map(argKey => (
                <div key={argKey} className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-deep-ink">{argKey}</label>
                  <textarea
                    value={promptArgs[argKey] || ''}
                    onChange={e => {
                      const val = e.target.value
                      setPromptArgs(prev => ({ ...prev, [argKey]: val }))
                    }}
                    rows={argKey === 'transcript' || argKey === 'conversationHistory' ? 4 : 2}
                    className="w-full font-mono text-xs p-2.5 bg-white border border-deep-ink/15 rounded-xl focus:outline-none focus:ring-1 focus:ring-hi-yellow resize-none"
                  />
                </div>
              ))}

              <Button
                onClick={handleEvaluatePrompt}
                disabled={isEvaluatingPrompt}
                className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-bold py-2 shadow-xs cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 mr-1" />
                {isEvaluatingPrompt ? 'Evaluating Prompt...' : 'Evaluate Prompt Template'}
              </Button>
            </div>

            {/* Evaluated Messages Display */}
            {promptResult && (
              <div className="space-y-2 pt-2 border-t border-deep-ink/10">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-moss-green" />
                    <span className="font-bold text-deep-ink">Evaluated Messages</span>
                    {promptTimeMs !== null && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {promptTimeMs} ms
                      </Badge>
                    )}
                  </div>
                </div>

                {promptResult.messages && Array.isArray(promptResult.messages) ? (
                  <div className="space-y-2.5">
                    {promptResult.messages.map((msg: any, i: number) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                          msg.role === 'system'
                            ? 'bg-soft-meadow/50 border-deep-ink/15 text-deep-ink'
                            : msg.role === 'assistant'
                            ? 'bg-hi-yellow/15 border-hi-yellow/40 text-deep-ink'
                            : 'bg-white border-deep-ink/10 text-deep-ink'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[10px] uppercase tracking-wider">
                            Role: {msg.role}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap font-mono text-[11px] text-slate">
                          {msg.content?.text || JSON.stringify(msg.content)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="bg-deep-ink text-white font-mono text-[11px] p-3.5 rounded-2xl overflow-auto max-h-72 leading-relaxed">
                    {JSON.stringify(promptResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Live Client State & Action Deck */}
        {activeTab === 'state' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-white">
            <div>
              <h3 className="font-serif font-bold text-sm text-deep-ink">Live In-Memory State & Action Deck</h3>
              <p className="text-xs text-slate mt-0.5">
                Direct state snapshot synchronized via <code className="bg-soft-meadow px-1 py-0.5 rounded font-mono">document.modelContext.clientState</code>.
              </p>
            </div>

            {/* Quick Metrics Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-canvas p-3 rounded-2xl border border-deep-ink/10 text-xs">
                <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Session</span>
                <span className="font-mono font-bold text-deep-ink truncate block text-[11px] mt-0.5">
                  {clientState?.activeSessionId || 'None'}
                </span>
              </div>
              <div className="bg-canvas p-3 rounded-2xl border border-deep-ink/10 text-xs">
                <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Doctor</span>
                <span className="font-mono font-bold text-deep-ink truncate block text-[11px] mt-0.5">
                  {clientState?.doctorId || 'doctor-1'}
                </span>
              </div>
              <div className="bg-canvas p-3 rounded-2xl border border-deep-ink/10 text-xs">
                <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Recording</span>
                <span className="font-bold flex items-center gap-1 text-[11px] mt-0.5">
                  {clientState?.isRecording ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-red-600">Active</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-moss-green" />
                      <span className="text-slate">Standby</span>
                    </>
                  )}
                </span>
              </div>
              <div className="bg-canvas p-3 rounded-2xl border border-deep-ink/10 text-xs">
                <span className="text-[10px] text-slate uppercase font-bold tracking-wider block">Transcript</span>
                <span className="font-mono font-bold text-deep-ink block text-[11px] mt-0.5">
                  {clientState?.transcriptLength ?? 0} chars
                </span>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="space-y-2 bg-canvas/40 p-4 rounded-2xl border border-deep-ink/10">
              <span className="text-xs font-bold text-deep-ink block">Execute Browser Actions Directly:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await modelContext?.executeTool('client_start_recording')
                    logActivity({ type: 'action', target: 'client_start_recording', status: 'success' })
                  }}
                  className="rounded-full text-xs gap-1 cursor-pointer bg-white hover:bg-soft-meadow"
                >
                  <Mic className="w-3.5 h-3.5 text-red-500" />
                  <span>Start Recording</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await modelContext?.executeTool('client_stop_recording')
                    logActivity({ type: 'action', target: 'client_stop_recording', status: 'success' })
                  }}
                  className="rounded-full text-xs gap-1 cursor-pointer bg-white hover:bg-soft-meadow"
                >
                  <Square className="w-3 h-3 text-deep-ink" />
                  <span>Stop Recording</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await modelContext?.executeTool('client_append_transcript', {
                      text: `[Clinical Note at ${new Date().toLocaleTimeString()}]: Vitals stable.`,
                    })
                    logActivity({ type: 'action', target: 'client_append_transcript', status: 'success' })
                  }}
                  className="rounded-full text-xs gap-1 cursor-pointer bg-white hover:bg-soft-meadow"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-moss-green" />
                  <span>Append Finding</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await modelContext?.executeTool('client_clear_transcript')
                    logActivity({ type: 'action', target: 'client_clear_transcript', status: 'success' })
                  }}
                  className="rounded-full text-xs gap-1 cursor-pointer bg-white hover:bg-soft-meadow text-slate"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Buffer</span>
                </Button>
              </div>
            </div>

            {/* State Inspector Tree */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate font-bold">Raw Store Snapshot</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(clientState || {}, null, 2))
                  }}
                  className="text-[10px] text-slate hover:text-deep-ink hover:underline cursor-pointer"
                >
                  Copy JSON
                </button>
              </div>
              <pre className="bg-canvas border border-deep-ink/10 text-deep-ink font-mono text-xs p-4 rounded-2xl overflow-auto leading-relaxed max-h-80">
                {JSON.stringify(clientState || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 5: Dynamic Tool Registration */}
        {activeTab === 'register' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-white">
            <div>
              <h3 className="font-serif font-bold text-sm text-deep-ink">Dynamic Tool Registration Builder</h3>
              <p className="text-xs text-slate mt-0.5">
                Register new callable clinical tools live into <code className="bg-soft-meadow px-1 py-0.5 rounded font-mono">document.modelContext</code> at runtime.
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
                onClick={handleRegisterCustomTool}
                className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 text-xs font-bold py-2.5 shadow-xs cursor-pointer"
              >
                Register Tool in document.modelContext
              </Button>
            </div>
          </div>
        )}

        {/* Tab 6: Activity Stream / Audit Log */}
        {activeTab === 'activity' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-deep-ink">WebMCP Session Activity</h3>
                <p className="text-xs text-slate mt-0.5">
                  Chronological stream of tool invocations, resource reads, and prompt evaluations.
                </p>
              </div>
              {activityLog.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActivityLog([])}
                  className="text-xs text-slate hover:text-red-600 cursor-pointer"
                >
                  Clear Log
                </Button>
              )}
            </div>

            {activityLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate text-xs space-y-2">
                <Clock className="w-8 h-8 text-slate/30" />
                <p className="font-semibold text-deep-ink">No activity yet</p>
                <p className="text-[11px] max-w-xs">
                  Execute tools or read resources from the playground to see live execution telemetry recorded here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activityLog.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-canvas border border-deep-ink/5 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            item.status === 'success' ? 'bg-moss-green/20 text-deep-ink' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="font-mono font-bold text-deep-ink text-[11px]">{item.target}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate font-mono">
                        {item.durationMs !== undefined && <span>{item.durationMs}ms</span>}
                        <span>{item.timestamp}</span>
                      </div>
                    </div>

                    {item.output && (
                      <pre className="bg-white p-2.5 rounded-xl border border-deep-ink/5 text-[10px] font-mono text-slate overflow-x-auto max-h-32">
                        {JSON.stringify(item.output, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
