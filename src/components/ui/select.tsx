import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value
export const SelectGroup = SelectPrimitive.Group
export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger className={cn('flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-night-950/40 px-3 py-2 text-sm data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 [&>span]:truncate', className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild><ChevronDown className="size-4 opacity-60" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}
export function SelectContent({ className, children, position = 'popper', ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content position={position} className={cn('relative z-50 max-h-80 min-w-[8rem] overflow-hidden rounded-xl border border-white/10 bg-popover text-popover-foreground shadow-2xl', position === 'popper' && 'data-[side=bottom]:translate-y-1 w-[var(--radix-select-trigger-width)]', className)} {...props}>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}
export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item className={cn('relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none focus:bg-white/10 data-[disabled]:opacity-50', className)} {...props}>
      <span className="absolute left-2 flex size-4 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="size-4 text-primary" /></SelectPrimitive.ItemIndicator></span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
