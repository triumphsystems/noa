/**
 * WebMCP Resources Index
 * Initializes and registers all clinical data resources and templates.
 */

import { WebMCPRegistry } from '../core/registry'
import { registerClinicalResources } from './clinical.resources'

export function registerAllResources(registry: WebMCPRegistry): void {
  registerClinicalResources(registry)
}
