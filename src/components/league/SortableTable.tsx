// Tableau triable : clic sur un en-tête pour trier, nouveau clic pour inverser, flèche ↑ / ↓ sur la colonne active.
// Au chargement, l'ordre fourni (tri par défaut de la page) est conservé tel quel.
// Les valeurs vides (null / undefined, affichées « – ») restent toujours en bas, quel que soit le sens.
import { useMemo, useState, type ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type SortValue = number | string | null | undefined
export type SortDir = 'asc' | 'desc'

export interface SortColumn<T> {
  key: string
  label: ReactNode
  /** info-bulle de l'en-tête (abréviations) */
  title?: string
  render: (row: T, index: number) => ReactNode
  /** valeur de tri ; sans elle la colonne n'est pas triable */
  sort?: (row: T) => SortValue
  /** sens du premier clic (par défaut : décroissant pour les nombres, croissant pour le texte) */
  first?: SortDir
  className?: string
  headClassName?: string
}

export interface SortState { key: string; dir: SortDir; initial?: boolean }

export function compareValues(a: SortValue, b: SortValue, dir: SortDir) {
  const ea = a === null || a === undefined || (typeof a === 'number' && Number.isNaN(a))
  const eb = b === null || b === undefined || (typeof b === 'number' && Number.isNaN(b))
  if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1 // vides toujours en bas
  const c = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'fr', { sensitivity: 'base', numeric: true })
  return dir === 'asc' ? c : -c
}

/** Tri stable d'une liste selon une colonne. */
export function sortRows<T>(rows: T[], value: (r: T) => SortValue, dir: SortDir): T[] {
  return rows.map((r, i) => ({ r, i, v: value(r) })).sort((a, b) => compareValues(a.v, b.v, dir) || a.i - b.i).map((x) => x.r)
}

export function useSort<T>(rows: T[], columns: SortColumn<T>[], initial?: { key: string; dir: SortDir }) {
  const [state, setState] = useState<SortState | null>(initial ? { ...initial, initial: true } : null)
  const sorted = useMemo(() => {
    if (!state || state.initial) return rows
    const col = columns.find((c) => c.key === state.key)
    return col?.sort ? sortRows(rows, col.sort, state.dir) : rows
  }, [rows, columns, state])
  const toggle = (key: string) => {
    const col = columns.find((c) => c.key === key)
    if (!col?.sort) return
    setState((cur) => {
      if (cur?.key === key) return { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' }
      const sample = rows.map(col.sort!).find((v) => v !== null && v !== undefined)
      return { key, dir: col.first ?? (typeof sample === 'string' ? 'asc' : 'desc') }
    })
  }
  return { rows: sorted, state, toggle }
}

export function SortHead({ col, state, onSort }: { col: Pick<SortColumn<unknown>, 'key' | 'label' | 'title' | 'headClassName' | 'sort'>; state: SortState | null; onSort: (key: string) => void }) {
  const active = state?.key === col.key
  if (!col.sort) return <TableHead className={col.headClassName} title={col.title}>{col.label}</TableHead>
  const right = /text-(center|right)/.exec(col.headClassName ?? '')?.[1]
  return (
    <TableHead className={cn(col.headClassName, 'p-0')} aria-sort={active ? (state!.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(col.key)} title={col.title ? `${col.title} — trier` : 'Trier'}
        className={cn('inline-flex h-9 w-full cursor-pointer items-center gap-1 px-2 uppercase tracking-wider transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-neon',
          right === 'center' && 'justify-center', right === 'right' && 'justify-end', active && 'text-neon')}>
        <span>{col.label}</span>
        <span aria-hidden className={cn('w-2.5 text-[11px] leading-none', !active && 'opacity-0')}>{active && state!.dir === 'asc' ? '↑' : '↓'}</span>
      </button>
    </TableHead>
  )
}

/** Tableau triable complet. */
export function SortableTable<T>({ rows, columns, rowKey, initial, rowClassName, className, empty }: {
  rows: T[]; columns: SortColumn<T>[]; rowKey: (r: T) => string
  initial?: { key: string; dir: SortDir }; rowClassName?: (r: T) => string | undefined | false; className?: string; empty?: ReactNode
}) {
  const s = useSort(rows, columns, initial)
  return (
    <Table className={className}>
      <TableHeader><TableRow className="hover:bg-transparent">{columns.map((c) => <SortHead key={c.key} col={c} state={s.state} onSort={s.toggle} />)}</TableRow></TableHeader>
      <TableBody>
        {s.rows.length === 0 && empty ? <TableRow><TableCell colSpan={columns.length} className="py-6 text-center text-muted-foreground">{empty}</TableCell></TableRow> : null}
        {s.rows.map((r, i) => (
          <TableRow key={rowKey(r)} className={rowClassName?.(r) || undefined}>
            {columns.map((c) => <TableCell key={c.key} className={c.className}>{c.render(r, i)}</TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
