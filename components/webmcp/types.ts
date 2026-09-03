export type InspectorTab = 'tools' | 'resources' | 'prompts' | 'state' | 'register' | 'activity'

export type ToolCategory = 'all' | 'clinical' | 'records' | 'database' | 'browser'

export interface ActivityItem {
  id: string
  timestamp: string
  type: 'tool' | 'resource' | 'prompt' | 'register' | 'action'
  target: string
  durationMs?: number
  status: 'success' | 'error'
  input?: any
  output?: any
}
