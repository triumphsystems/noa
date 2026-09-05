/**
 * WebMCP Dispatcher
 * Handles JSON-RPC 2.0 protocol dispatching for MCP requests.
 */

import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  RPC_ERROR_CODES,
  MCP_PROTOCOL_VERSION,
  ServerInfo,
  ServerCapabilities,
  InitializeResult,
  ExecutionContext,
} from './types';
import { WebMCPRegistry, registry as defaultRegistry } from './registry';

const SERVER_INFO: ServerInfo = {
  name: 'noa-clinical-webmcp',
  version: '1.0.0',
  description: 'Noa Clinical AI & Ambient Medical Voice WebMCP Server',
};

const SERVER_CAPABILITIES: ServerCapabilities = {
  tools: {
    listChanged: false,
  },
  resources: {
    subscribe: false,
    listChanged: false,
  },
  prompts: {
    listChanged: false,
  },
};

export class WebMCPDispatcher {
  constructor(private registry: WebMCPRegistry = defaultRegistry) {}

  public async dispatch(
    request: JsonRpcRequest,
    context?: ExecutionContext
  ): Promise<JsonRpcResponse> {
    const id = request.id ?? null;

    if (
      !request ||
      request.jsonrpc !== '2.0' ||
      typeof request.method !== 'string'
    ) {
      return this.error(
        id,
        RPC_ERROR_CODES.INVALID_REQUEST,
        'Invalid JSON-RPC 2.0 request'
      );
    }

    try {
      switch (request.method) {
        case 'initialize': {
          const result: InitializeResult = {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: SERVER_CAPABILITIES,
            serverInfo: SERVER_INFO,
            instructions:
              'Noa WebMCP provides clinical AI tools, patient records, consultation sessions, SOAP note synthesis, and voice intake workflows.',
          };
          return this.success(id, result);
        }

        case 'ping': {
          return this.success(id, {});
        }

        case 'tools/list': {
          const tools = this.registry.listTools();
          return this.success(id, { tools });
        }

        case 'tools/call': {
          const params = request.params as
            { name?: string; arguments?: Record<string, any> } | undefined;
          if (!params || !params.name) {
            return this.error(
              id,
              RPC_ERROR_CODES.INVALID_PARAMS,
              'Missing tool name in tools/call'
            );
          }

          const callResult = await this.registry.callTool(
            params.name,
            params.arguments || {},
            context
          );
          return this.success(id, callResult);
        }

        case 'resources/list': {
          const resources = this.registry.listResources();
          return this.success(id, { resources });
        }

        case 'resources/templates/list': {
          const resourceTemplates = this.registry.listResourceTemplates();
          return this.success(id, { resourceTemplates });
        }

        case 'resources/read': {
          const params = request.params as { uri?: string } | undefined;
          if (!params || !params.uri) {
            return this.error(
              id,
              RPC_ERROR_CODES.INVALID_PARAMS,
              'Missing uri in resources/read'
            );
          }

          const readResult = await this.registry.readResource(
            params.uri,
            context
          );
          return this.success(id, readResult);
        }

        case 'prompts/list': {
          const prompts = this.registry.listPrompts();
          return this.success(id, { prompts });
        }

        case 'prompts/get': {
          const params = request.params as
            { name?: string; arguments?: Record<string, string> } | undefined;
          if (!params || !params.name) {
            return this.error(
              id,
              RPC_ERROR_CODES.INVALID_PARAMS,
              'Missing prompt name in prompts/get'
            );
          }

          const promptResult = await this.registry.getPrompt(
            params.name,
            params.arguments || {},
            context
          );
          return this.success(id, promptResult);
        }

        default: {
          return this.error(
            id,
            RPC_ERROR_CODES.METHOD_NOT_FOUND,
            `Method not found: "${request.method}"`
          );
        }
      }
    } catch (err: any) {
      return this.error(
        id,
        RPC_ERROR_CODES.INTERNAL_ERROR,
        err?.message || 'Internal server error while processing request'
      );
    }
  }

  private success<T>(
    id: string | number | null,
    result: T
  ): JsonRpcSuccessResponse<T> {
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }

  private error(
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown
  ): JsonRpcErrorResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        ...(data ? { data } : {}),
      },
    };
  }
}

export const dispatcher = new WebMCPDispatcher();
