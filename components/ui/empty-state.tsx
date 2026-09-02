import * as React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <Card className={cn('bg-soft-meadow/50 border-dashed border-deep-ink/15 p-12 text-center flex flex-col items-center justify-center', className)}>
      {icon && <div className="mb-4 text-slate/80">{icon}</div>}
      {title && <h4 className="text-lg font-semibold font-serif text-deep-ink mb-1">{title}</h4>}
      <p className="text-sm text-slate max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  )
}
