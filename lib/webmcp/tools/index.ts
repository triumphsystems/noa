/**
 * WebMCP Tools Index
 * Initializes and registers all server-side callable tools.
 */

import { WebMCPRegistry } from '../core/registry';
import { registerClinicalTools } from './clinical';
import { registerIntakeTools } from './intake';

export function registerAllTools(registry: WebMCPRegistry): void {
  registerClinicalTools(registry);
  registerIntakeTools(registry);
}
