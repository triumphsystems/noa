/**
 * WebMCP Registry
 * Central registry and execution engine for all MCP tools, resources, and prompts.
 */

import {
  ToolDefinition,
  ToolHandler,
  CallToolResult,
  ResourceDefinition,
  ResourceTemplate,
  ResourceReader,
  ReadResourceResult,
  PromptDefinition,
  PromptGenerator,
  GetPromptResult,
  ExecutionContext,
} from './types'

export class WebMCPRegistry {
  private static instance: WebMCPRegistry

  private tools = new Map<string, { definition: ToolDefinition; handler: ToolHandler }>()
  private resources = new Map<string, { definition: ResourceDefinition; reader: ResourceReader }>()
  private resourceTemplates: Array<{ template: ResourceTemplate; reader: ResourceReader; regex: RegExp; paramNames: string[] }> = []
  private prompts = new Map<string, { definition: PromptDefinition; generator: PromptGenerator }>()

  public static getInstance(): WebMCPRegistry {
    if (!WebMCPRegistry.instance) {
      WebMCPRegistry.instance = new WebMCPRegistry()
    }
    return WebMCPRegistry.instance
  }

  // ==========================================
  // Tool Management
  // ==========================================

  public registerTool(definition: ToolDefinition, handler: ToolHandler): this {
    this.tools.set(definition.name, { definition, handler })
    return this
  }

  public unregisterTool(name: string): boolean {
    return this.tools.delete(name)
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name)?.definition
  }

  public listTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(item => item.definition)
  }

  public async callTool(
    name: string,
    input: Record<string, any> = {},
    context?: ExecutionContext
  ): Promise<CallToolResult> {
    const entry = this.tools.get(name)
    if (!entry) {
      throw new Error(`Tool not found: "${name}"`)
    }

    try {
      const result = await entry.handler(input, context)

      // Normalize result to CallToolResult
      if (typeof result === 'string') {
        return {
          content: [{ type: 'text', text: result }],
        }
      }

      if (result && Array.isArray((result as CallToolResult).content)) {
        return result as CallToolResult
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error executing tool "${name}": ${err?.message || String(err)}` }],
      }
    }
  }

  // ==========================================
  // Resource Management
  // ==========================================

  public registerResource(definition: ResourceDefinition, reader: ResourceReader): this {
    this.resources.set(definition.uri, { definition, reader })
    return this
  }

  public registerResourceTemplate(template: ResourceTemplate, reader: ResourceReader): this {
    // Convert RFC 6570 URI template e.g. "patient://{patientId}" into RegExp
    const paramNames: string[] = []
    const pattern = template.uriTemplate.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, paramName) => {
      paramNames.push(paramName)
      return '([^/?#]+)'
    })

    const regex = new RegExp(`^${pattern}$`)
    this.resourceTemplates.push({ template, reader, regex, paramNames })
    return this
  }

  public listResources(): ResourceDefinition[] {
    return Array.from(this.resources.values()).map(item => item.definition)
  }

  public listResourceTemplates(): ResourceTemplate[] {
    return this.resourceTemplates.map(item => item.template)
  }

  public async readResource(uri: string, context?: ExecutionContext): Promise<ReadResourceResult> {
    // 1. Check exact resource match
    const exact = this.resources.get(uri)
    if (exact) {
      const raw = await exact.reader(uri, {}, context)
      return this.normalizeResourceResult(uri, exact.definition.mimeType, raw)
    }

    // 2. Check template match
    for (const item of this.resourceTemplates) {
      const match = uri.match(item.regex)
      if (match) {
        const parameters: Record<string, string> = {}
        item.paramNames.forEach((name, index) => {
          parameters[name] = decodeURIComponent(match[index + 1])
        })

        const raw = await item.reader(uri, parameters, context)
        return this.normalizeResourceResult(uri, item.template.mimeType, raw)
      }
    }

    throw new Error(`Resource not found for URI: "${uri}"`)
  }

  private normalizeResourceResult(
    uri: string,
    defaultMimeType: string | undefined,
    raw: ReadResourceResult | Record<string, any> | string
  ): ReadResourceResult {
    if (typeof raw === 'string') {
      return {
        contents: [
          {
            uri,
            mimeType: defaultMimeType || 'text/plain',
            text: raw,
          },
        ],
      }
    }

    if (raw && Array.isArray((raw as ReadResourceResult).contents)) {
      return raw as ReadResourceResult
    }

    return {
      contents: [
        {
          uri,
          mimeType: defaultMimeType || 'application/json',
          text: JSON.stringify(raw, null, 2),
        },
      ],
    }
  }

  // ==========================================
  // Prompt Management
  // ==========================================

  public registerPrompt(definition: PromptDefinition, generator: PromptGenerator): this {
    this.prompts.set(definition.name, { definition, generator })
    return this
  }

  public listPrompts(): PromptDefinition[] {
    return Array.from(this.prompts.values()).map(item => item.definition)
  }

  public async getPrompt(
    name: string,
    args: Record<string, string> = {},
    context?: ExecutionContext
  ): Promise<GetPromptResult> {
    const entry = this.prompts.get(name)
    if (!entry) {
      throw new Error(`Prompt not found: "${name}"`)
    }

    return entry.generator(args, context)
  }
}

export const registry = WebMCPRegistry.getInstance()
