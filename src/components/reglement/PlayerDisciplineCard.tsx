// Fiche joueur : compteur de jaunes « 2/3 », totaux de la saison, historique des suspensions (match, motif, purgée).
import { Link } from 'react-router-dom'
import { Ban } from 'lucide-react'
import { useLookup } from '@/hooks/useData'
import { usePlayerDiscipline } from '@/hooks/useDiscipline'
import { REGLEMENT, SUSPENSION_LABEL } from '@/lib/reglement'
import { phaseLabel } from '@/lib/disciplineLabels'
import { fmtDate } from '@/lib/format'
import { ArtLink } from './ArtLink'
import { YellowCounter } from './YellowCounter'
import { cn } from '@/lib/utils'

export function useIsSuspended(playerId?: string, seasonId?: string | null) {
  return usePlayerDiscipline(playerId, seasonId).totals.remaining
}

export function SuspendedBadge({ remaining, className }: { remaining: number; className?: string }) {
  if (remaining <= 0) return null
  return <span className={cn('inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-red-200', className)} title={`Suspendu : ${remaining} match(s) à purger (Art. ${REGLEMENT.cards.artRed})`}><Ban className="size-3" aria-hidden />Suspendu</span>
}

export function PlayerDisciplineCard({ playerId, seasonId }: { playerId: string; seasonId?: string | null }) {
  const L = useLookup()
  const { rows, totals, active } = usePlayerDiscipline(playerId, seasonId)
  if (!active) return null
  const many = rows.length > 1
  const history = rows.flatMap((r) => r.d.suspensions.map((s) => ({ s, comp: r.competition })))
  return (
    <section aria-labelledby="discipline-title" className="glass rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="discipline-title" className="title-caps text-2xl">Discipline</h2>
        <SuspendedBadge remaining={totals.remaining} />
        <span className="ml-auto flex gap-2"><ArtLink art={REGLEMENT.cards.artYellow} /><ArtLink art={REGLEMENT.cards.artRed} /></span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-muted-foreground">Cartons jaunes (cumul)</p>
          {rows.length ? rows.map((r) => <div key={r.competition.id} className="mt-1 flex items-center justify-between gap-2">{many && <span className="text-xs">{phaseLabel(r.competition)}</span>}<YellowCounter d={r.d} /></div>) : <div className="mt-1"><YellowCounter d={{ counter: 0, remaining: 0 }} /></div>}
          {rows.some((r) => r.d.counter === REGLEMENT.cards.yellowsForSuspension - 1 && r.d.remaining === 0) && <p className="mt-1 text-xs text-amber-300">Encore un jaune = 1 match de suspension.</p>}
        </div>
        <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-muted-foreground">Saison</p><p className="mt-1 text-sm"><span className="num text-2xl text-amber-300">{totals.yellow}</span> jaune{totals.yellow > 1 ? 's' : ''} · <span className="num text-2xl text-red-300">{totals.red}</span> rouge{totals.red > 1 ? 's' : ''}</p></div>
        <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-muted-foreground">À purger</p><p className="mt-1 text-sm"><span className={cn('num text-2xl', totals.remaining ? 'text-red-300' : 'text-win')}>{totals.remaining}</span> match{totals.remaining > 1 ? 's' : ''}</p></div>
      </div>
      {history.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <caption className="mb-1 text-left text-xs text-muted-foreground">Historique des suspensions</caption>
          <thead><tr className="text-xs text-muted-foreground"><th className="py-1 text-left">Match</th><th className="text-left">Motif</th><th className="text-center">Matchs</th><th className="text-right">Purgée</th></tr></thead>
          <tbody>{history.map(({ s, comp }) => {
            const m = L.match.get(s.origin_match_id ?? '')
            const vs = m ? `${L.team.get(m.home_team_id)?.short_name}–${L.team.get(m.away_team_id)?.short_name}` : '—'
            const done = s.served.length >= s.matches
            return (
              <tr key={s.id} className="border-t border-white/5 align-top">
                <td className="py-1.5">{m ? <Link to={`/matchs/${m.id}`} className="hover:text-neon">{vs}</Link> : vs}<span className="block text-[11px] text-muted-foreground">{m ? fmtDate(m.date, 'd MMM') : ''}{many ? ` · ${phaseLabel(comp)}` : ''}</span></td>
                <td>{SUSPENSION_LABEL[s.kind]}{s.reason && <span className="block text-xs text-muted-foreground">{s.reason}</span>}</td>
                <td className="num text-center">{s.matches}</td>
                <td className={cn('text-right text-xs font-semibold', done ? 'text-win' : 'text-red-300')}>{done ? 'Oui' : `Non (${s.matches - s.served.length} restant${s.matches - s.served.length > 1 ? 's' : ''})`}</td>
              </tr>
            )
          })}</tbody>
        </table>
      )}
    </section>
  )
}
