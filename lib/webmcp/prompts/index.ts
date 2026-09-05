/**
 * WebMCP Prompts Index
 * Initializes and registers all clinical prompt templates.
 */

import { WebMCPRegistry } from '../core/registry';
import { registerClinicalPrompts } from './clinical.prompts';

export function registerAllPrompts(registry: WebMCPRegistry): void {
  registerClinicalPrompts(registry);
}
