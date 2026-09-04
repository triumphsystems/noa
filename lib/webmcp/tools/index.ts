/**
 * WebMCP Tools Index
 * Initializes and registers all server-side callable tools.
 */

import { WebMCPRegistry } from '../core/registry'
import { registerClinicalTools } from './clinical-tools'
import { registerIntakeTools } from './intake-tools'

export function registerAllTools(registry: WebMCPRegistry): void {
  registerClinicalTools(registry)
  registerIntakeTools(registry)
}
