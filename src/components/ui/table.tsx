import * as React from 'react'
import { cn } from '@/lib/utils'
export const Table = ({ className, ...p }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="relative w-full overflow-x-auto"><table className={cn('w-full caption-bottom text-sm', className)} {...p} /></div>
)
export const TableHeader = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className={cn('[&_tr]:border-b [&_tr]:border-white/10', className)} {...p} />
export const TableBody = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...p} />
export const TableRow = ({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) => <tr className={cn('border-b border-white/5 transition-colors hover:bg-white/[.03]', className)} {...p} />
export const TableHead = ({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className={cn('h-9 px-2 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap', className)} {...p} />
export const TableCell = ({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn('px-2 py-2 align-middle whitespace-nowrap', className)} {...p} />
