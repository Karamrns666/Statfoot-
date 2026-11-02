import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
export const Tabs = TabsPrimitive.Root
export const TabsList = ({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List className={cn('inline-flex max-w-full items-center gap-1 overflow-x-auto scrollbar-none rounded-xl border border-white/10 bg-night-950/40 p-1', className)} {...p} />
)
export const TabsTrigger = ({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger className={cn('inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-all cursor-pointer data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_0_0_1px_rgb(34_211_238/.35)] [&_svg]:size-4', className)} {...p} />
)
export const TabsContent = ({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.Content>) => <TabsPrimitive.Content className={cn('mt-4 outline-none', className)} {...p} />
