import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-medium transition-colors border select-none',
  {
    variants: {
      variant: {
        // Claude signature chromatic accent (Hi-Yellow in Noa)
        default:
          'bg-hi-yellow/20 text-deep-ink border-hi-yellow/40 font-semibold',
        secondary: 'bg-soft-meadow text-deep-ink border-deep-ink/10',
        outline: 'border-deep-ink/15 text-slate bg-transparent',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        draft: 'bg-deep-ink/5 text-slate border-deep-ink/10',
        danger:
          'bg-red-50/80 text-red-800 border-red-200/80 font-medium shadow-2xs',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
