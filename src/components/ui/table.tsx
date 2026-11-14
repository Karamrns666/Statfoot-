import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Tableau. `stickyCols` : nombre de colonnes figées à gauche lors du défilement horizontal (rang, logo, nom) —
 * fond opaque et petite ombre de séparation. `stickyHeader` : en-tête figé en haut lors du défilement vertical
 * (le tableau défile alors dans son cadre, hauteur limitée à l'écran).
 */
export const Table = ({ className, stickyCols = 0, stickyHeader = false, ...p }: React.HTMLAttributes<HTMLTableElement> & { stickyCols?: number; stickyHeader?: boolean }) => {
  const ref = React.useRef<HTMLTableElement>(null)
  React.useLayoutEffect(() => {
    const table = ref.current
    if (!table || !stickyCols) return
    const apply = () => {
      const head = table.querySelector('tr')
      if (!head) return
      const lefts: number[] = []
      let x = 0
      const cells = [...head.children] as HTMLElement[]
      for (let i = 0; i < stickyCols && i < cells.length; i++) { lefts.push(x); x += cells[i].offsetParent ? cells[i].getBoundingClientRect().width : 0 }
      for (const row of table.querySelectorAll('tr')) {
        const cs = [...row.children] as HTMLElement[]
        cs.forEach((c, i) => {
          const on = i < stickyCols && (c as HTMLTableCellElement).colSpan === 1
          c.classList.toggle('sticky-col', on)
          c.classList.toggle('sticky-col-last', on && i === stickyCols - 1)
          c.style.left = on ? `${lefts[i]}px` : ''
        })
      }
    }
    apply()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null
    ro?.observe(table)
    const mo = new MutationObserver(apply)
    mo.observe(table, { childList: true, subtree: true })
    return () => { ro?.disconnect(); mo.disconnect() }
  }, [stickyCols])
  return (
    <div className={cn('table-scroll relative w-full overflow-x-auto', stickyHeader && 'sticky-head max-h-[min(78vh,900px)] overflow-y-auto overscroll-x-contain')}>
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...p} />
    </div>
  )
}
export const TableHeader = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className={cn('[&_tr]:border-b [&_tr]:border-white/10', className)} {...p} />
export const TableBody = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...p} />
export const TableRow = ({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) => <tr className={cn('border-b border-white/5 transition-colors hover:bg-white/[.03]', className)} {...p} />
export const TableHead = ({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className={cn('h-9 px-2 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap', className)} {...p} />
export const TableCell = ({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn('px-2 py-2 align-middle whitespace-nowrap', className)} {...p} />
