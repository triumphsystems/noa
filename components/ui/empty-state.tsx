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
    <Card className={cn('bg-white border-dashed border-deep-ink/15 p-10 sm:p-12 text-center flex flex-col items-center justify-center shadow-none', className)}>
      {icon && <div className="mb-3 text-slate/60">{icon}</div>}
      {title && <h4 className="text-base sm:text-lg font-medium font-serif text-deep-ink mb-1">{title}</h4>}
      <p className="text-xs sm:text-sm text-slate max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  )
}
