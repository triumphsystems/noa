/**
 * WebMCP Route Handler
 * Endpoint: /api/mcp
 * Implements MCP HTTP & SSE transports for remote agents, Claude Desktop, Cursor, and web clients.
 */

import { NextRequest, NextResponse } from 'next/server'
import { initWebMCPServer } from '@/lib/webmcp/server/init'
import { dispatcher } from '@/lib/webmcp/core/dispatcher'
import { registry } from '@/lib/webmcp/core/registry'
import { JsonRpcRequest, ExecutionContext } from '@/lib/webmcp/core/types'

// Ensure tools, resources, and prompts are registered
initWebMCPServer()

// Standard CORS headers for cross-origin agent connectivity
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-mcp-api-key, baggage, traceparent',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

/**
 * POST /api/mcp
 * Standard MCP JSON-RPC 2.0 endpoint.
 * Accepts single request { jsonrpc: '2.0', id, method, params } or batch array.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json()

    // Extract execution context from headers
    const authHeader = req.headers.get('authorization')
    const apiKeyHeader = req.headers.get('x-mcp-api-key')

    const context: ExecutionContext = {
      apiKey: apiKeyHeader || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined),
    }

    // Handle batch JSON-RPC requests
    if (Array.isArray(rawBody)) {
      const responses = await Promise.all(
        rawBody.map(rpcReq => dispatcher.dispatch(rpcReq as JsonRpcRequest, context))
      )
      return NextResponse.json(responses, { headers: CORS_HEADERS })
    }

    // Handle single JSON-RPC request
    const response = await dispatcher.dispatch(rawBody as JsonRpcRequest, context)
    return NextResponse.json(response, { headers: CORS_HEADERS })
  } catch (error: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error: Request body could not be parsed as valid JSON',
          data: error?.message,
        },
      },
      {
        status: 400,
        headers: CORS_HEADERS,
      }
    )
  }
}

/**
 * GET /api/mcp
 * - If Accept: text/event-stream -> Returns Server-Sent Events (SSE) stream for persistent MCP connections.
 * - Otherwise -> Returns WebMCP service discovery metadata.
 */
export async function GET(req: NextRequest) {
  const acceptHeader = req.headers.get('accept') || ''

  // 1. Server-Sent Events (SSE) Stream
  if (acceptHeader.includes('text/event-stream')) {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()

        // Send initial endpoint event conforming to MCP SSE transport specification
        controller.enqueue(
          encoder.encode(`event: endpoint\ndata: ${req.nextUrl.origin}/api/mcp\n\n`)
        )

        // Send ready message
        controller.enqueue(
          encoder.encode(`event: message\ndata: ${JSON.stringify({
            jsonrpc: '2.0',
            method: 'notifications/initialized',
            params: { server: 'noa-clinical-webmcp', version: '1.0.0' },
          })}\n\n`)
        )

        // Keep-alive heartbeat interval
        const intervalId = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'))
          } catch {
            clearInterval(intervalId)
          }
        }, 15000)

        req.signal.addEventListener('abort', () => {
          clearInterval(intervalId)
          controller.close()
        })
      },
    })

    return new NextResponse(stream, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    })
  }

  // 2. Service Discovery Metadata
  const tools = registry.listTools()
  const resources = registry.listResources()
  const resourceTemplates = registry.listResourceTemplates()
  const prompts = registry.listPrompts()

  return NextResponse.json(
    {
      name: 'noa-clinical-webmcp',
      version: '1.0.0',
      protocolVersion: '2024-11-05',
      description: 'Noa Clinical AI & Ambient Medical Voice WebMCP Server',
      endpoint: '/api/mcp',
      sseEndpoint: '/api/mcp',
      browserStandard: 'document.modelContext',
      stats: {
        toolsCount: tools.length,
        resourcesCount: resources.length,
        resourceTemplatesCount: resourceTemplates.length,
        promptsCount: prompts.length,
      },
      tools: tools.map(t => ({ name: t.name, description: t.description })),
      resourceTemplates: resourceTemplates.map(r => ({ uriTemplate: r.uriTemplate, name: r.name })),
      prompts: prompts.map(p => ({ name: p.name, description: p.description })),
    },
    { headers: CORS_HEADERS }
  )
}
