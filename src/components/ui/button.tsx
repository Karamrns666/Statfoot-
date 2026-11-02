import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[0_0_20px_-4px_rgb(34_211_238/.7)] hover:brightness-110',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline: 'border border-input bg-white/5 hover:bg-white/10',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-white/10',
        link: 'text-primary underline-offset-4 hover:underline',
        gold: 'bg-award-gold text-night-950 shadow-[0_0_22px_-4px_rgb(250_204_21/.7)] hover:brightness-110',
      },
      size: { default: 'h-10 px-4 py-2', sm: 'h-8 rounded-md px-3 text-xs', lg: 'h-12 rounded-xl px-6 text-base', icon: 'size-10', xl: 'h-16 rounded-2xl px-6 text-lg' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = 'Button'
export { buttonVariants }
