/**
 * WebMCP Core Protocol Types
 * Strictly conforms to Model Context Protocol (MCP) spec (version 2024-11-05)
 * and the browser document.modelContext standard.
 */

// ==========================================
// JSON-RPC 2.0 Base Types
// ==========================================

export interface JsonRpcRequest<T = Record<string, unknown>> {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: T
}

export interface JsonRpcNotification<T = Record<string, unknown>> {
  jsonrpc: '2.0'
  method: string
  params?: T
}

export interface JsonRpcSuccessResponse<T = unknown> {
  jsonrpc: '2.0'
  id: string | number | null
  result: T
}

export interface JsonRpcError {
  code: number
  message: string
  data?: unknown
}

export interface JsonRpcErrorResponse {
  jsonrpc: '2.0'
  id: string | number | null
  error: JsonRpcError
}

export type JsonRpcResponse<T = unknown> = JsonRpcSuccessResponse<T> | JsonRpcErrorResponse

// Standard JSON-RPC Error Codes
export const RPC_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // MCP-specific codes
  RESOURCE_NOT_FOUND: -32001,
  TOOL_EXECUTION_ERROR: -32002,
  UNAUTHORIZED: -32003,
} as const

// ==========================================
// MCP Protocol Capabilities & Info
// ==========================================

export const MCP_PROTOCOL_VERSION = '2024-11-05'

export interface ServerInfo {
  name: string
  version: string
  description?: string
}

export interface ServerCapabilities {
  tools?: {
    listChanged?: boolean
  }
  resources?: {
    subscribe?: boolean
    listChanged?: boolean
  }
  prompts?: {
    listChanged?: boolean
  }
  logging?: Record<string, unknown>
}

export interface InitializeResult {
  protocolVersion: string
  capabilities: ServerCapabilities
  serverInfo: ServerInfo
  instructions?: string
}

// ==========================================
// MCP Tools Specification
// ==========================================

export interface JsonSchemaProperty {
  type: string
  description?: string
  enum?: string[]
  items?: JsonSchemaProperty
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
  default?: unknown
}

export interface ToolInputSchema {
  type: 'object'
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
  additionalProperties?: boolean
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: ToolInputSchema
}

export interface TextContent {
  type: 'text'
  text: string
}

export interface ImageContent {
  type: 'image'
  data: string
  mimeType: string
}

export interface ResourceContent {
  type: 'resource'
  resource: {
    uri: string
    mimeType?: string
    text?: string
    blob?: string
  }
}

export type ContentItem = TextContent | ImageContent | ResourceContent

export interface CallToolResult {
  content: ContentItem[]
  isError?: boolean
}

export type ToolHandler = (
  input: Record<string, any>,
  context?: ExecutionContext
) => Promise<CallToolResult | Record<string, any> | string>

// ==========================================
// MCP Resources Specification
// ==========================================

export interface ResourceDefinition {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface ResourceTemplate {
  uriTemplate: string
  name: string
  description?: string
  mimeType?: string
}

export interface ReadResourceContent {
  uri: string
  mimeType?: string
  text?: string
  blob?: string
}

export interface ReadResourceResult {
  contents: ReadResourceContent[]
}

export type ResourceReader = (
  uri: string,
  parameters: Record<string, string>,
  context?: ExecutionContext
) => Promise<ReadResourceResult | Record<string, any> | string>

// ==========================================
// MCP Prompts Specification
// ==========================================

export interface PromptArgument {
  name: string
  description?: string
  required?: boolean
}

export interface PromptDefinition {
  name: string
  description?: string
  arguments?: PromptArgument[]
}

export interface PromptMessage {
  role: 'user' | 'assistant' | 'system'
  content: ContentItem
}

export interface GetPromptResult {
  description?: string
  messages: PromptMessage[]
}

export type PromptGenerator = (
  args: Record<string, string>,
  context?: ExecutionContext
) => Promise<GetPromptResult>

// ==========================================
// Context & Execution
// ==========================================

export interface ExecutionContext {
  userId?: string
  userType?: 'doctor' | 'patient' | 'system'
  doctorId?: string
  patientId?: string
  apiKey?: string
  isClientSide?: boolean
}

// ==========================================
// Browser document.modelContext Spec
// ==========================================

export interface BrowserToolRegistration {
  name: string
  description: string
  inputSchema?: ToolInputSchema | Record<string, unknown>
  execute: (input: any) => Promise<any>
}

export interface BrowserResourceRegistration {
  uri: string
  name: string
  description?: string
  mimeType?: string
  read: (uri: string) => Promise<any>
}

export interface BrowserPromptRegistration {
  name: string
  description?: string
  arguments?: PromptArgument[]
  getMessages: (args: Record<string, string>) => Promise<PromptMessage[]>
}

export interface BrowserModelContext {
  version: string
  registerTool: (tool: BrowserToolRegistration) => void
  unregisterTool: (name: string) => boolean
  getTool: (name: string) => BrowserToolRegistration | undefined
  listTools: () => ToolDefinition[]
  executeTool: (name: string, input?: Record<string, unknown>) => Promise<CallToolResult>
  readResource: (uri: string) => Promise<ReadResourceResult>
  listResources: () => ResourceDefinition[]
  getPrompt: (name: string, args?: Record<string, string>) => Promise<GetPromptResult>
  listPrompts: () => PromptDefinition[]
  clientState?: Record<string, unknown>
}
