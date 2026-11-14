import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
export const Tabs = TabsPrimitive.Root
/** Barre d'onglets : défile horizontalement si elle est trop large, avec un dégradé qui indique la suite (aucun texte coupé net). */
export const TabsList = ({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.List>) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const [edges, setEdges] = React.useState({ l: false, r: false })
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setEdges({ l: el.scrollLeft > 2, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(el)
    return () => { el.removeEventListener('scroll', update); ro?.disconnect() }
  }, [])
  const mask = edges.l || edges.r ? `linear-gradient(to right, ${edges.l ? 'transparent 0, black 28px' : 'black 0'}, ${edges.r ? 'black calc(100% - 36px), transparent 100%' : 'black 100%'})` : undefined
  return <TabsPrimitive.List ref={ref} style={{ WebkitMaskImage: mask, maskImage: mask }} className={cn('inline-flex max-w-full items-center gap-1 overflow-x-auto scrollbar-none rounded-xl border border-white/10 bg-night-950/40 p-1', className)} {...p} />
}
export const TabsTrigger = ({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger className={cn('inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-all cursor-pointer data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_0_0_1px_rgb(242_107_29/.35)] [&_svg]:size-4', className)} {...p} />
)
export const TabsContent = ({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.Content>) => <TabsPrimitive.Content className={cn('mt-4 outline-none', className)} {...p} />
