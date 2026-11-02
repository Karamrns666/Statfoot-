import * as React from 'react'
import * as DM from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
export const DropdownMenu = DM.Root
export const DropdownMenuTrigger = DM.Trigger
export function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof DM.Content>) {
  return <DM.Portal><DM.Content sideOffset={sideOffset} className={cn('z-50 min-w-[10rem] overflow-hidden rounded-xl border border-white/10 bg-popover p-1 shadow-2xl', className)} {...props} /></DM.Portal>
}
export const DropdownMenuItem = ({ className, ...p }: React.ComponentProps<typeof DM.Item>) => <DM.Item className={cn('flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm outline-none focus:bg-white/10 [&_svg]:size-4', className)} {...p} />
export const DropdownMenuLabel = ({ className, ...p }: React.ComponentProps<typeof DM.Label>) => <DM.Label className={cn('px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground', className)} {...p} />
export const DropdownMenuSeparator = ({ className, ...p }: React.ComponentProps<typeof DM.Separator>) => <DM.Separator className={cn('-mx-1 my-1 h-px bg-white/10', className)} {...p} />
