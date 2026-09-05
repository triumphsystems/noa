/**
 * WebMCP Server Initialization
 * Bootstraps registry with all tools, resources, and prompts.
 */

import { registry, WebMCPRegistry } from '../core/registry';
import { registerAllTools } from '../tools';
import { registerAllResources } from '../resources';
import { registerAllPrompts } from '../prompts';

let isInitialized = false;

export function initWebMCPServer(
  targetRegistry: WebMCPRegistry = registry
): WebMCPRegistry {
  if (isInitialized) {
    return targetRegistry;
  }

  registerAllTools(targetRegistry);
  registerAllResources(targetRegistry);
  registerAllPrompts(targetRegistry);

  isInitialized = true;
  return targetRegistry;
}
