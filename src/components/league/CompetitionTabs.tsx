// Filtre de compétition (Toutes / Gold Cup / Silver Cup…) — même composant sur Matchs, Classement, Stats, Joueurs.
import type { Competition } from '@/types/entities'
import { cn } from '@/lib/utils'

export function CompetitionTabs({ comps, value, onChange, allLabel = 'Toutes', className }: { comps: Competition[]; value: string; onChange: (id: string) => void; allLabel?: string | null; className?: string }) {
  const items = [...(allLabel ? [{ id: '', name: allLabel, color: '#FFFFFF' }] : []), ...comps.map((c) => ({ id: c.id, name: c.name, color: c.color ?? '#F85A00' }))]
  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="tablist" aria-label="Compétition">
      {items.map((c) => {
        const on = value === c.id
        return (
          <button key={c.id || 'all'} role="tab" aria-selected={on} onClick={() => onChange(c.id)}
            className={cn('inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 font-display text-lg font-black uppercase leading-none transition', on ? 'text-ink' : 'border-white/15 text-muted-foreground hover:text-white')}
            style={on ? { background: c.color, borderColor: c.color } : undefined}>
            {c.id && <span className="size-2.5 rounded-full" style={{ background: on ? '#0A0F33' : c.color }} />}{c.name}
          </button>
        )
      })}
    </div>
  )
}
