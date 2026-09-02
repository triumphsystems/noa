import * as React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  helperText?: string
  className?: string
}

export function StatCard({ label, value, icon, helperText, className }: StatCardProps) {
  return (
    <Card className={cn('bg-soft-meadow border-deep-ink/10 p-6', className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate text-sm font-medium">{label}</p>
        {icon && <div className="text-slate">{icon}</div>}
      </div>
      <p className="text-3xl font-bold font-serif text-deep-ink tracking-tight">{value}</p>
      {helperText && <p className="text-xs text-slate mt-1">{helperText}</p>}
    </Card>
  )
}
