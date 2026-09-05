import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        'border-deep-ink/15 flex flex-col items-center justify-center border-dashed bg-white p-10 text-center shadow-none sm:p-12',
        className
      )}
    >
      {icon && <div className="text-slate/60 mb-3">{icon}</div>}
      {title && (
        <h4 className="text-deep-ink mb-1 font-serif text-base font-medium sm:text-lg">
          {title}
        </h4>
      )}
      <p className="text-slate max-w-sm text-xs leading-relaxed sm:text-sm">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
