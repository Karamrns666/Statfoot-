// Thème des graphiques (palette validée : scripts/validate_palette — fond #0A2556, mode sombre).
// Série 1 = orange, série 2 = bleu. Une seule série → orange. Texte en encre neutre, jamais dans la couleur de série.
import type { ReactNode } from 'react'
export const SERIES = ['#E04E00', '#2a8fc4'] as const
export const AXIS = { stroke: 'rgba(255,255,255,.12)', tick: { fill: '#9DB8DE', fontSize: 11 }, tickLine: false, axisLine: false }
export const GRID = { stroke: 'rgba(255,255,255,.06)', vertical: false }
export const TOOLTIP = {
  contentStyle: { background: '#04163D', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#e6edf8', fontSize: 12 },
  labelStyle: { color: '#e6edf8', fontWeight: 700 },
  itemStyle: { color: '#e6edf8' },
  cursor: { fill: 'rgba(255,255,255,.05)' },
}
export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">{items.map((i) => <span key={i.label} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: i.color }} />{i.label}</span>)}</div>
}
export function ChartBox({ title, legend, children, height = 240 }: { title: string; legend?: ReactNode; children: ReactNode; height?: number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="title-caps text-base">{title}</h3>{legend}</div>
      <div style={{ height }}>{children}</div>
    </div>
  )
}
