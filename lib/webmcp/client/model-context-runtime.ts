/**
 * Browser-Native Model Context Runtime
 * Implements document.modelContext conforming to the WebMCP browser standard.
 */

import {
  BrowserModelContext,
  BrowserToolRegistration,
  ToolDefinition,
  CallToolResult,
  ReadResourceResult,
  ResourceDefinition,
  GetPromptResult,
  PromptDefinition,
  JsonRpcResponse,
} from '../core/types'
import { useSessionStore } from '@/lib/stores/session.store'
import { useDoctorStore } from '@/lib/stores/doctor.store'
import { CLINICAL_SERVER_TOOL_DEFINITIONS } from '../tools/definitions'

export class BrowserModelContextRuntime implements BrowserModelContext {
  public version = '1.0.0'
  private localTools = new Map<string, BrowserToolRegistration>()
  private cachedServerTools: ToolDefinition[] = []
  private cachedServerResources: ResourceDefinition[] = []
  private cachedServerPrompts: PromptDefinition[] = []

  constructor(private apiEndpoint = '/api/mcp') {
    this.registerClientStoreTools()
    this.registerServerProxyTools()
  }

  /**
   * Register a tool locally on document.modelContext
   */
  public registerTool(tool: BrowserToolRegistration): void {
    if (!tool.name) {
      throw new Error('Tool must have a valid name')
    }
    this.localTools.set(tool.name, tool)

    // Forward to browser native modelContext if Chrome flag is active
    if (typeof window !== 'undefined') {
      const nativeContext = (window as any).__nativeModelContext
      if (nativeContext && typeof nativeContext.registerTool === 'function' && nativeContext !== this) {
        try {
          nativeContext.registerTool({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            execute: tool.execute,
          })
        } catch {
          // Ignore native registration conflicts
        }
      }
    }
  }

  /**
   * Unregister a tool
   */
  public unregisterTool(name: string): boolean {
    return this.localTools.delete(name)
  }

  /**
   * Retrieve a tool registration
   */
  public getTool(name: string): BrowserToolRegistration | undefined {
    return this.localTools.get(name)
  }

  /**
   * List all available tools (local + cached server tools)
   */
  public listTools(): ToolDefinition[] {
    const localDefs: ToolDefinition[] = Array.from(this.localTools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: (tool.inputSchema as any) || { type: 'object', properties: {} },
    }))

    // Merge unique by name
    const map = new Map<string, ToolDefinition>()
    this.cachedServerTools.forEach(t => map.set(t.name, t))
    localDefs.forEach(t => map.set(t.name, t))

    return Array.from(map.values())
  }

  /**
   * Execute a tool by name (dispatches to local tool or delegates to /api/mcp)
   */
  public async executeTool(name: string, input: Record<string, unknown> = {}): Promise<CallToolResult> {
    // 1. Check local client-registered tools
    const local = this.localTools.get(name)
    if (local) {
      try {
        const raw = await local.execute(input)
        if (typeof raw === 'string') {
          return { content: [{ type: 'text', text: raw }] }
        }
        if (raw && Array.isArray(raw.content)) {
          return raw as CallToolResult
        }
        return { content: [{ type: 'text', text: JSON.stringify(raw, null, 2) }] }
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Client execution error for "${name}": ${err?.message || String(err)}` }],
        }
      }
    }

    // 2. Delegate to server endpoint via standard MCP JSON-RPC 2.0
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `req-${Date.now()}`,
          method: 'tools/call',
          params: {
            name,
            arguments: input,
          },
        }),
      })

      const json: JsonRpcResponse<CallToolResult> = await response.json()
      if ('error' in json) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Server error: ${json.error.message}` }],
        }
      }

      return json.result
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Network error calling tool "${name}": ${err?.message || String(err)}` }],
      }
    }
  }

  /**
   * Read a resource by URI
   */
  public async readResource(uri: string): Promise<ReadResourceResult> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `res-${Date.now()}`,
        method: 'resources/read',
        params: { uri },
      }),
    })

    const json: JsonRpcResponse<ReadResourceResult> = await response.json()
    if ('error' in json) {
      throw new Error(json.error.message)
    }

    return json.result
  }

  public listResources(): ResourceDefinition[] {
    return this.cachedServerResources
  }

  /**
   * Get an evaluated prompt template
   */
  public async getPrompt(name: string, args: Record<string, string> = {}): Promise<GetPromptResult> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `prompt-${Date.now()}`,
        method: 'prompts/get',
        params: { name, arguments: args },
      }),
    })

    const json: JsonRpcResponse<GetPromptResult> = await response.json()
    if ('error' in json) {
      throw new Error(json.error.message)
    }

    return json.result
  }

  public listPrompts(): PromptDefinition[] {
    return this.cachedServerPrompts
  }

  /**
   * Sync tool schemas and resources from the server
   */
  public async syncServerDefinitions(): Promise<void> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { jsonrpc: '2.0', id: 1, method: 'tools/list' },
          { jsonrpc: '2.0', id: 2, method: 'resources/list' },
          { jsonrpc: '2.0', id: 3, method: 'prompts/list' },
        ]),
      })

      const results = await response.json()
      if (Array.isArray(results)) {
        results.forEach((res: any) => {
          if (res.id === 1 && res.result?.tools) {
            this.cachedServerTools = res.result.tools
            // Register server tools so Chrome DevTools discovers all clinical tools
            res.result.tools.forEach((serverTool: ToolDefinition) => {
              if (!this.localTools.has(serverTool.name)) {
                this.registerTool({
                  name: serverTool.name,
                  description: serverTool.description,
                  inputSchema: serverTool.inputSchema as any,
                  execute: async (input) => this.executeTool(serverTool.name, input),
                })
              }
            })
          } else if (res.id === 2 && res.result?.resources) {
            this.cachedServerResources = res.result.resources
          } else if (res.id === 3 && res.result?.prompts) {
            this.cachedServerPrompts = res.result.prompts
          }
        })
      }
    } catch (e) {
      console.warn('[WebMCP] Failed to sync server definitions on startup:', e)
    }
  }

  /**
   * Dynamic client state access (reads from Zustand stores)
   */
  public get clientState(): Record<string, unknown> {
    try {
      const session = useSessionStore.getState()
      const doctorState = useDoctorStore.getState()
      return {
        session: {
          sessionId: session.sessionId,
          patientName: session.patientName,
          status: session.status,
          isRecording: session.isRecording,
          duration: session.duration,
          messagesCount: session.messages.length,
          hasSoapNote: Boolean(session.soapNote),
        },
        doctor: {
          doctorId: doctorState.doctor?.id,
          name: doctorState.doctor?.name,
          specialty: doctorState.doctor?.specialty,
        },
      }
    } catch {
      return {}
    }
  }

  /**
   * Pre-register client-side tools that interact directly with browser memory
   */
  private registerClientStoreTools(): void {
    // 1. client_get_active_session
    this.registerTool({
      name: 'client_get_active_session',
      description: 'Returns the current active consultation session state from browser memory.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => {
        const state = useSessionStore.getState()
        return {
          sessionId: state.sessionId,
          patientName: state.patientName,
          status: state.status,
          isRecording: state.isRecording,
          duration: state.duration,
          transcriptLength: state.transcript.length,
          hasSoapNote: Boolean(state.soapNote),
          suggestions: state.suggestions,
        }
      },
    })

    // 2. client_start_recording
    this.registerTool({
      name: 'client_start_recording',
      description: 'Starts audio recording on the client session store.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => {
        useSessionStore.getState().startRecording()
        return { success: true, isRecording: true }
      },
    })

    // 3. client_stop_recording
    this.registerTool({
      name: 'client_stop_recording',
      description: 'Stops audio recording on the client session store.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => {
        useSessionStore.getState().stopRecording()
        return { success: true, isRecording: false }
      },
    })

    // 4. client_append_transcript
    this.registerTool({
      name: 'client_append_transcript',
      description: 'Appends or replaces transcript text in the active client consultation session.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Transcript text chunk to append.' },
        },
        required: ['text'],
      },
      execute: async (input) => {
        const store = useSessionStore.getState()
        const newTranscript = store.transcript ? `${store.transcript} ${input.text}` : input.text
        store.setTranscript(newTranscript)
        return { success: true, transcriptLength: newTranscript.length }
      },
    })
  }

  /**
   * Pre-register clinical server tools as proxy callers so Chrome DevTools discovers them instantly
   */
  private registerServerProxyTools(): void {
    CLINICAL_SERVER_TOOL_DEFINITIONS.forEach((toolDef) => {
      if (!this.localTools.has(toolDef.name)) {
        this.registerTool({
          name: toolDef.name,
          description: toolDef.description,
          inputSchema: toolDef.inputSchema as any,
          execute: async (input) => this.executeTool(toolDef.name, input),
        })
      }
    })
  }
}


/**
 * Attaches the WebMCP runtime to document.modelContext and bridges with Chrome DevTools
 */
export function injectBrowserModelContext(): BrowserModelContextRuntime {
  if (typeof window === 'undefined') {
    return new BrowserModelContextRuntime()
  }

  // Preserve native browser modelContext if Chrome flag is active
  const nativeDocContext = (document as any).modelContext
  const nativeNavContext = (navigator as any).modelContext
  const native = (nativeDocContext && typeof nativeDocContext.registerTool === 'function')
    ? nativeDocContext
    : (nativeNavContext && typeof nativeNavContext.registerTool === 'function')
      ? nativeNavContext
      : null

  if (native) {
    ;(window as any).__nativeModelContext = native
  }

  const runtime = new BrowserModelContextRuntime()

  // Standard: document.modelContext
  try {
    Object.defineProperty(document, 'modelContext', {
      value: runtime,
      writable: true,
      configurable: true,
      enumerable: true,
    })
  } catch {
    ;(document as any).modelContext = runtime
  }

  // Mirror to navigator.modelContext for Chrome DevTools InspectorWebMCPAgent compatibility
  try {
    if (!(navigator as any).modelContext) {
      Object.defineProperty(navigator, 'modelContext', {
        value: runtime,
        writable: true,
        configurable: true,
        enumerable: true,
      })
    }
  } catch {
    ;(navigator as any).modelContext = runtime
  }

  // Sync server definitions in background
  runtime.syncServerDefinitions()

  // Dispatch DOM readiness event for DevTools panels & browser extensions
  try {
    document.dispatchEvent(new CustomEvent('modelcontext:ready', { detail: { version: runtime.version } }))
    window.dispatchEvent(new CustomEvent('webmcp:ready', { detail: { version: runtime.version } }))
  } catch {}

  return runtime
}

