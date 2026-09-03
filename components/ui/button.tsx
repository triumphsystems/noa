import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-deep-ink/20 active:translate-y-px disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        // Claude filled primary action: Dark carbon fill on light surfaces
        dark: 'bg-deep-ink text-canvas hover:bg-deep-ink/90 shadow-2xs border-transparent',
        // Signature brand chromatic action: Radiant Hi-Yellow
        default: 'bg-hi-yellow text-deep-ink hover:bg-[#ebd020] border-deep-ink/10 shadow-2xs font-semibold',
        outline:
          'border-deep-ink/15 bg-transparent text-deep-ink hover:bg-soft-meadow hover:border-deep-ink/25',
        secondary:
          'bg-soft-meadow text-deep-ink hover:bg-[#e4e8d8] border-deep-ink/8',
        ghost:
          'hover:bg-soft-meadow text-deep-ink/80 hover:text-deep-ink',
        destructive:
          'bg-red-50 text-red-700 hover:bg-red-100 border-red-200 shadow-2xs',
        link: 'text-deep-ink underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        xs: 'h-6 px-2.5 text-xs rounded-md',
        sm: 'h-8 px-3 text-xs rounded-md',
        lg: 'h-11 px-6 text-base rounded-lg',
        icon: 'size-9',
        'icon-xs': 'size-6 rounded-md',
        'icon-sm': 'size-8 rounded-md',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
