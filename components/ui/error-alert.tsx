import * as React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ErrorAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onDismiss?: () => void;
  variant?: 'inline' | 'card';
}

export function ErrorAlert({
  title,
  message,
  onDismiss,
  variant = 'inline',
  className,
  ...props
}: ErrorAlertProps) {
  if (!message) return null;

  if (variant === 'card') {
    return (
      <div
        role="alert"
        className={cn(
          'relative rounded-2xl border border-red-200/80 bg-gradient-to-b from-red-50/90 to-red-50/40 p-6 text-center shadow-xs transition-all sm:p-8',
          className
        )}
        {...props}
      >
        <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl border border-red-200/60 bg-red-100/80 text-red-700 shadow-2xs">
          <AlertCircle className="h-5 w-5" />
        </div>
        {title && (
          <h3 className="text-deep-ink mb-1.5 font-serif text-lg font-bold">
            {title}
          </h3>
        )}
        <p className="text-slate mx-auto max-w-md text-xs leading-relaxed sm:text-sm">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        'animate-in fade-in-50 flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/80 px-3.5 py-2.5 text-xs text-red-900 shadow-2xs transition-all duration-200',
        className
      )}
      {...props}
    >
      <div className="mt-0.5 shrink-0 text-red-600">
        <AlertCircle className="h-4 w-4" />
      </div>
      <div className="flex-1 leading-relaxed">
        {title && (
          <span className="text-deep-ink mr-1.5 font-semibold">{title}</span>
        )}
        <span className="font-medium text-red-800/90">{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-0.5 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700"
          aria-label="Dismiss error"
        >
          <XCircle className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
