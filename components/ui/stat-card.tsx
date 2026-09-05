import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  helperText?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  helperText,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'border-deep-ink/8 shadow-editorial bg-white p-5 sm:p-6',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-slate truncate text-xs font-medium tracking-tight sm:text-sm">
          {label}
        </p>
        {icon && <div className="text-slate/70 shrink-0">{icon}</div>}
      </div>
      <p className="text-deep-ink truncate font-serif text-2xl font-medium tracking-tight sm:text-3xl">
        {value}
      </p>
      {helperText && (
        <p className="text-slate/80 mt-1 truncate text-xs">{helperText}</p>
      )}
    </Card>
  );
}
