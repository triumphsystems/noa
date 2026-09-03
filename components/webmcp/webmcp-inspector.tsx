'use client'

/**
 * WebMCP Developer Inspector & Studio
 * Modular orchestrator for document.modelContext tools, resources, prompts, and client state.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Terminal, Database, FileText, Activity, PlusCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useModelContext } from '@/lib/webmcp'
import type { ToolDefinition, ResourceDefinition, PromptDefinition } from '@/lib/webmcp/core/types'
import type { InspectorTab, ActivityItem } from './types'
import { LauncherButton } from './launcher-button'
import { InspectorHeader } from './header'
import {
  ToolsTab,
  ResourcesTab,
  PromptsTab,
  StateTab,
  RegisterTab,
  ActivityTab,
} from './tabs'

export function WebMCPInspector() {
  const modelContext = useModelContext()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<InspectorTab>('tools')

  // Registry state
  const [tools, setTools] = useState<ToolDefinition[]>([])
  const [resources, setResources] = useState<ResourceDefinition[]>([])
  const [prompts, setPrompts] = useState<PromptDefinition[]>([])
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  // Sync tools, resources, and prompts from local runtime and server
  const refreshRegistry = useCallback(async () => {
    if (!modelContext) return
    setIsSyncing(true)
    try {
      if (
        'syncServerDefinitions' in modelContext &&
        typeof (modelContext as any).syncServerDefinitions === 'function'
      ) {
        await (modelContext as any).syncServerDefinitions()
      }
      setTools(modelContext.listTools())
      setResources(modelContext.listResources())
      setPrompts(modelContext.listPrompts())
    } catch {
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

  // Keyboard shortcut: Ctrl + Shift + M to toggle, Esc to close
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

  // Logging telemetry into activity stream
  const logActivity = useCallback((item: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newItem: ActivityItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    }
    setActivityLog(prev => [newItem, ...prev.slice(0, 49)])
  }, [])

  const handleExecuteTool = useCallback(
    async (name: string, input: Record<string, any> = {}) => {
      if (!modelContext) throw new Error('ModelContext is not initialized')
      return modelContext.executeTool(name, input)
    },
    [modelContext]
  )

  const handleReadResource = useCallback(
    async (uri: string) => {
      if (!modelContext) throw new Error('ModelContext is not initialized')
      return modelContext.readResource(uri)
    },
    [modelContext]
  )

  const handleGetPrompt = useCallback(
    async (name: string, args: Record<string, string> = {}) => {
      if (!modelContext) throw new Error('ModelContext is not initialized')
      return modelContext.getPrompt(name, args)
    },
    [modelContext]
  )

  const handleRegisterTool = useCallback(
    (tool: any) => {
      if (!modelContext) throw new Error('ModelContext is not initialized')
      modelContext.registerTool(tool)
    },
    [modelContext]
  )

  const clientState = modelContext?.clientState as any

  return (
    <>
      {/* Floating Trigger Button */}
      <LauncherButton toolCount={tools.length} onToggle={() => setIsOpen(prev => !prev)} />

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
        {/* Header */}
        <InspectorHeader
          isExpanded={isExpanded}
          isSyncing={isSyncing}
          onToggleExpand={() => setIsExpanded(prev => !prev)}
          onRefresh={refreshRegistry}
          onClose={() => setIsOpen(false)}
        />

        {/* Tab Navigation */}
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
              {prompts.length || 6}
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

        {/* Tab Views */}
        {activeTab === 'tools' && (
          <ToolsTab
            tools={tools}
            onExecuteTool={handleExecuteTool}
            logActivity={logActivity}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesTab
            onReadResource={handleReadResource}
            logActivity={logActivity}
          />
        )}

        {activeTab === 'prompts' && (
          <PromptsTab
            onGetPrompt={handleGetPrompt}
            logActivity={logActivity}
          />
        )}

        {activeTab === 'state' && (
          <StateTab
            clientState={clientState}
            onExecuteTool={handleExecuteTool}
            logActivity={logActivity}
          />
        )}

        {activeTab === 'register' && (
          <RegisterTab
            onRegisterTool={handleRegisterTool}
            onRefreshRegistry={refreshRegistry}
            logActivity={logActivity}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityTab
            activityLog={activityLog}
            onClearLog={() => setActivityLog([])}
          />
        )}
      </aside>
    </>
  )
}
