'use client';

/**
 * WebMCP Developer Inspector & Studio
 * Modular orchestrator for document.modelContext tools, resources, prompts, and client state.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal,
  Database,
  FileText,
  Activity,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useModelContext } from '@/lib/webmcp';
import type {
  ToolDefinition,
  ResourceDefinition,
  PromptDefinition,
} from '@/lib/webmcp/core/types';
import type { InspectorTab, ActivityItem } from './types';
import { Launcher } from './launcher';
import { InspectorHeader } from './header';
import {
  ToolsTab,
  ResourcesTab,
  PromptsTab,
  StateTab,
  RegisterTab,
  ActivityTab,
} from './tabs';

export function WebMCPInspector() {
  const modelContext = useModelContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<InspectorTab>('tools');

  // Registry state
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [resources, setResources] = useState<ResourceDefinition[]>([]);
  const [prompts, setPrompts] = useState<PromptDefinition[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync definitions from local runtime and /api/mcp
  const refreshRegistry = useCallback(async () => {
    if (!modelContext) return;
    setIsSyncing(true);
    try {
      if (
        'syncServerDefinitions' in modelContext &&
        typeof (modelContext as any).syncServerDefinitions === 'function'
      ) {
        await (modelContext as any).syncServerDefinitions();
      }
      setTools(modelContext.listTools());
      setResources(modelContext.listResources());
      setPrompts(modelContext.listPrompts());
    } catch {
      setTools(modelContext.listTools());
      setResources(modelContext.listResources());
      setPrompts(modelContext.listPrompts());
    } finally {
      setIsSyncing(false);
    }
  }, [modelContext]);

  useEffect(() => {
    refreshRegistry();
    const timer = setInterval(refreshRegistry, 5000);
    return () => clearInterval(timer);
  }, [refreshRegistry]);

  // Keyboard shortcut: Ctrl + Shift + M to toggle, Esc to collapse/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Log activity telemetry
  const logActivity = useCallback(
    (item: Omit<ActivityItem, 'id' | 'timestamp'>) => {
      const newItem: ActivityItem = {
        ...item,
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };
      setActivityLog((prev) => [newItem, ...prev.slice(0, 49)]);
    },
    []
  );

  const handleExecuteTool = useCallback(
    async (name: string, input: Record<string, any> = {}) => {
      if (!modelContext) throw new Error('ModelContext is not initialized');
      return modelContext.executeTool(name, input);
    },
    [modelContext]
  );

  const handleReadResource = useCallback(
    async (uri: string) => {
      if (!modelContext) throw new Error('ModelContext is not initialized');
      return modelContext.readResource(uri);
    },
    [modelContext]
  );

  const handleGetPrompt = useCallback(
    async (name: string, args: Record<string, string> = {}) => {
      if (!modelContext) throw new Error('ModelContext is not initialized');
      return modelContext.getPrompt(name, args);
    },
    [modelContext]
  );

  const handleRegisterTool = useCallback(
    (tool: any) => {
      if (!modelContext) throw new Error('ModelContext is not initialized');
      modelContext.registerTool(tool);
    },
    [modelContext]
  );

  const clientState = modelContext?.clientState as any;

  // When closed, only render floating launcher. Drawer is completely unmounted!
  if (!isOpen) {
    return (
      <Launcher toolCount={tools.length} onToggle={() => setIsOpen(true)} />
    );
  }

  return (
    <>
      {/* Floating Trigger Button (kept in corner for reference) */}
      <Launcher toolCount={tools.length} onToggle={() => setIsOpen(false)} />

      {/* Backdrop for easy canceling/dismissing */}
      <div
        className="bg-deep-ink/40 fixed inset-0 z-50 cursor-pointer backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-Over Studio Drawer with Light Cream Canvas */}
      <aside
        className={`bg-canvas border-deep-ink/10 animate-in slide-in-from-right fixed inset-y-0 right-0 z-50 flex flex-col border-l shadow-2xl transition-all duration-200 duration-300 ease-in-out ${
          isExpanded
            ? 'w-full sm:w-[90vw] lg:w-[1140px]'
            : 'w-full sm:w-[680px] lg:w-[760px]'
        }`}
      >
        {/* Studio Header */}
        <InspectorHeader
          isExpanded={isExpanded}
          isSyncing={isSyncing}
          onToggleExpand={() => setIsExpanded((prev) => !prev)}
          onRefresh={refreshRegistry}
          onClose={() => setIsOpen(false)}
        />

        {/* Segmented Tabs Bar */}
        <div className="border-deep-ink/10 bg-canvas flex shrink-0 scrollbar-none items-center justify-between gap-2 overflow-x-auto border-b px-5 py-2 font-sans">
          <div className="bg-soft-meadow/80 border-deep-ink/8 flex items-center gap-1 rounded-xl border p-1">
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === 'tools'
                  ? 'text-deep-ink bg-white font-semibold shadow-2xs'
                  : 'text-slate hover:text-deep-ink hover:bg-white/50'
              }`}
            >
              <Terminal className="h-3.5 w-3.5 opacity-80" />
              <span>Tools</span>
              <span
                className={`py-0.2 rounded-md px-1.5 font-mono text-[10px] ${
                  activeTab === 'tools'
                    ? 'bg-hi-yellow text-deep-ink font-bold'
                    : 'bg-deep-ink/5 text-slate'
                }`}
              >
                {tools.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === 'resources'
                  ? 'text-deep-ink bg-white font-semibold shadow-2xs'
                  : 'text-slate hover:text-deep-ink hover:bg-white/50'
              }`}
            >
              <Database className="h-3.5 w-3.5 opacity-80" />
              <span>Resources</span>
              <span
                className={`py-0.2 rounded-md px-1.5 font-mono text-[10px] ${
                  activeTab === 'resources'
                    ? 'bg-hi-yellow text-deep-ink font-bold'
                    : 'bg-deep-ink/5 text-slate'
                }`}
              >
                {resources.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === 'prompts'
                  ? 'text-deep-ink bg-white font-semibold shadow-2xs'
                  : 'text-slate hover:text-deep-ink hover:bg-white/50'
              }`}
            >
              <FileText className="h-3.5 w-3.5 opacity-80" />
              <span>Prompts</span>
              <span
                className={`py-0.2 rounded-md px-1.5 font-mono text-[10px] ${
                  activeTab === 'prompts'
                    ? 'bg-hi-yellow text-deep-ink font-bold'
                    : 'bg-deep-ink/5 text-slate'
                }`}
              >
                {prompts.length || 6}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('state')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === 'state'
                  ? 'text-deep-ink bg-white font-semibold shadow-2xs'
                  : 'text-slate hover:text-deep-ink hover:bg-white/50'
              }`}
            >
              <Activity className="h-3.5 w-3.5 opacity-80" />
              <span>State</span>
              {clientState?.isRecording && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === 'register'
                  ? 'text-deep-ink bg-white font-semibold shadow-2xs'
                  : 'text-slate hover:text-deep-ink hover:bg-white/50'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Register</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'activity'
                ? 'bg-deep-ink border-deep-ink font-semibold text-white shadow-2xs'
                : 'bg-soft-meadow/80 border-deep-ink/10 text-slate hover:text-deep-ink hover:bg-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5 opacity-80" />
            <span>Activity</span>
            {activityLog.length > 0 && (
              <span
                className={`py-0.2 rounded-md px-1.5 font-mono text-[10px] font-bold ${
                  activeTab === 'activity'
                    ? 'bg-hi-yellow text-deep-ink'
                    : 'bg-deep-ink/10 text-deep-ink'
                }`}
              >
                {activityLog.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Panes (all with signature light cream canvas) */}
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
          <PromptsTab onGetPrompt={handleGetPrompt} logActivity={logActivity} />
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
  );
}
