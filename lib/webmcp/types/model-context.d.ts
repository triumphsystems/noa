/**
 * TypeScript Global Declarations for Browser Model Context Standard
 * Extends Document, Navigator, and Window with modelContext and webmcp.
 */

import type { BrowserModelContext } from '../core/types'

declare global {
  interface Document {
    modelContext: BrowserModelContext
  }

  interface Navigator {
    modelContext: BrowserModelContext
  }

  interface Window {
    webmcp: BrowserModelContext
    modelContext?: BrowserModelContext
  }
}

export {}
