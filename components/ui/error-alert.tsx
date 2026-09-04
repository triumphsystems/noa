import * as React from 'react'
import { AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ErrorAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message: string
  onDismiss?: () => void
  variant?: 'inline' | 'card'
}

export function ErrorAlert({
  title,
  message,
  onDismiss,
  variant = 'inline',
  className,
  ...props
}: ErrorAlertProps) {
  if (!message) return null

  if (variant === 'card') {
    return (
      <div
        role="alert"
        className={cn(
          'relative rounded-2xl border border-red-200/80 bg-gradient-to-b from-red-50/90 to-red-50/40 p-6 sm:p-8 text-center shadow-xs transition-all',
          className
        )}
        {...props}
      >
        <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-red-100/80 text-red-700 shadow-2xs border border-red-200/60">
          <AlertCircle className="h-5 w-5" />
        </div>
        {title && (
          <h3 className="mb-1.5 font-serif text-lg font-bold text-deep-ink">
            {title}
          </h3>
        )}
        <p className="text-xs sm:text-sm text-slate leading-relaxed max-w-md mx-auto">
          {message}
        </p>
      </div>
    )
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/80 px-3.5 py-2.5 text-xs text-red-900 shadow-2xs transition-all animate-in fade-in-50 duration-200',
        className
      )}
      {...props}
    >
      <div className="mt-0.5 shrink-0 text-red-600">
        <AlertCircle className="h-4 w-4" />
      </div>
      <div className="flex-1 leading-relaxed">
        {title && <span className="font-semibold text-deep-ink mr-1.5">{title}</span>}
        <span className="font-medium text-red-800/90">{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-0.5 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
          aria-label="Dismiss error"
        >
          <XCircle className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
