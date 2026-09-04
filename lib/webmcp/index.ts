/**
 * Noa WebMCP
 * Complete Model Context Protocol (MCP) suite for web & server.
 */


// Core
export * from './core/types'
export { WebMCPRegistry, registry } from './core/registry'
export { WebMCPDispatcher, dispatcher } from './core/dispatcher'

// Tools
export { registerAllTools } from './tools'
export { registerClinicalTools } from './tools/clinical-tools'
export { registerIntakeTools } from './tools/intake-tools'

// Resources
export { registerAllResources } from './resources'
export { registerClinicalResources } from './resources/clinical-resources'

// Prompts
export { registerAllPrompts } from './prompts'
export { registerClinicalPrompts } from './prompts/clinical-prompts'

// Server Initializer
export { initWebMCPServer } from './server/init'

// Client & document.modelContext
export {
  BrowserModelContextRuntime,
  injectBrowserModelContext,
} from './client/model-context-runtime'
export {
  WebMCPProvider,
  useModelContext,
} from './client/webmcp-provider'
export { WebMCPInspector } from '@/components/webmcp/inspector'
