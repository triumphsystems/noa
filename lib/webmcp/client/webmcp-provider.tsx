'use client'

/**
 * WebMCP React Provider
 * Initializes document.modelContext and window.webmcp upon client mount.
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { BrowserModelContext } from '../core/types'
import { BrowserModelContextRuntime, injectBrowserModelContext } from './model-context-runtime'

import { WebMCPInspector } from '@/components/webmcp/inspector'

interface WebMCPContextValue {
  modelContext: BrowserModelContext | null
  isReady: boolean
}

const WebMCPContext = createContext<WebMCPContextValue>({
  modelContext: null,
  isReady: false,
})

export function WebMCPProvider({ children }: { children: React.ReactNode }) {
  const [contextRuntime, setContextRuntime] = useState<BrowserModelContextRuntime | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const runtime = injectBrowserModelContext()
    setContextRuntime(runtime)
    setIsReady(true)

    // Log clean injection
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[WebMCP] document.modelContext initialized with Noa clinical tools, resources, and prompts.'
      )
    }
  }, [])

  return (
    <WebMCPContext.Provider value={{ modelContext: contextRuntime, isReady }}>
      {children}
      <WebMCPInspector />
    </WebMCPContext.Provider>
  )
}

/**
 * Hook to access the active BrowserModelContext in React components
 */
export function useModelContext(): BrowserModelContext | null {
  const { modelContext } = useContext(WebMCPContext)
  return modelContext
}
