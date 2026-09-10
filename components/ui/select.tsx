import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, icon, ...props }, ref) => {
    return (
      <div className="relative inline-block w-full">
        <select
          ref={ref}
          data-slot="select"
          className={cn(
            'border-deep-ink/10 bg-canvas text-deep-ink placeholder:text-slate/60 focus-visible:border-deep-ink focus-visible:ring-deep-ink/20 flex h-9 w-full appearance-none rounded-xl border py-2 pr-8 pl-3 text-xs shadow-2xs transition-colors cursor-pointer focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-slate/70">
          {icon || <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
