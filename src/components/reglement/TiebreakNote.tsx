// Sous chaque classement : « Critères de départage (Art. 17.3) » + info-bulle expliquant les égalités de points.
import { useId, useState } from 'react'
import { Info } from 'lucide-react'
import { useLookup } from '@/hooks/useData'
import { TIEBREAKERS, TIEBREAK_ART } from '@/lib/reglement'
import type { StandingRow } from '@/lib/standings'
import { ArtLink } from './ArtLink'

export function tiebreakText(r: StandingRow, name: (id: string) => string) {
  if (!r.tiebreak) return null
  return `${name(r.tiebreak.above)} devant ${name(r.team_id)} à égalité de points — ${r.tiebreak.detail}.`
}

export function TiebreakNote({ rows }: { rows: StandingRow[] }) {
  const L = useLookup()
  const [open, setOpen] = useState(false)
  const id = useId()
  const name = (t: string) => L.team.get(t)?.name ?? t
  const ties = rows.filter((r) => r.tiebreak && r.played > 0)
  return (
    <div className="mt-3 px-1 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold text-foreground/90">Critères de départage</span>
        <ArtLink art={TIEBREAK_ART} />
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 hover:border-neon/60 hover:text-neon">
          <Info className="size-3.5" aria-hidden />Pourquoi cet ordre ?
        </button>
      </div>
      <p className="mt-1">{TIEBREAKERS.map((t, i) => `${i + 1}. ${t.short}`).join(' · ')}</p>
      {open && (
        <div id={id} role="note" className="mt-2 max-w-2xl rounded-xl border border-white/10 bg-night-950/90 p-3 text-[13px] leading-snug text-foreground shadow-xl">
          {ties.length ? (
            <ul className="space-y-1.5">{ties.map((r) => <li key={r.team_id}><span className="num mr-1 text-neon">{r.rank}.</span>{tiebreakText(r, name)}</li>)}</ul>
          ) : <p>Aucune égalité de points : l’ordre suit les points (victoire 3, nul 1, défaite 0).</p>}
          <p className="mt-2 text-xs text-muted-foreground">Chaque critère ne s’applique que si l’égalité persiste après le précédent. La confrontation directe se calcule sur les seuls matchs entre les équipes à égalité (mini-classement si elles sont 3 ou plus).</p>
        </div>
      )}
    </div>
  )
}
