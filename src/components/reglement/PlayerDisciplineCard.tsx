// Fiche joueur : cartons de la saison (information, sans cumul — Art. 11.5), suspensions décidées par le conseil de
// discipline (Art. 19) avec leur purge. Seule la sanction retenue est affichée, jamais le détail des votes.
import { Link } from 'react-router-dom'
import { Ban } from 'lucide-react'
import { useLookup } from '@/hooks/useData'
import { usePlayerDiscipline } from '@/hooks/useDiscipline'
import { REGLEMENT, SUSPENSION_LABEL } from '@/lib/reglement'
import { fmtDate } from '@/lib/format'
import { ArtLink } from './ArtLink'
import { cn } from '@/lib/utils'

export function useIsSuspended(playerId?: string, seasonId?: string | null) {
  return usePlayerDiscipline(playerId, seasonId)?.remaining ?? 0
}

export function SuspendedBadge({ remaining, className }: { remaining: number; className?: string }) {
  if (remaining <= 0) return null
  return <span className={cn('inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-red-200', className)} title={`Suspendu par le conseil de discipline : ${remaining} match(s) à purger (Art. 19)`}><Ban className="size-3" aria-hidden />Suspendu</span>
}

export function PlayerDisciplineCard({ playerId, seasonId }: { playerId: string; seasonId?: string | null }) {
  const L = useLookup()
  const d = usePlayerDiscipline(playerId, seasonId)
  if (!d) return null
  const remaining = d.remaining
  return (
    <section aria-labelledby="discipline-title" className="glass rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="discipline-title" className="title-caps text-2xl">Discipline</h2>
        <SuspendedBadge remaining={remaining} />
        <span className="ml-auto flex gap-2"><ArtLink art={REGLEMENT.cards.artYellow} /><ArtLink art="19" /></span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-muted-foreground">Cartons cette saison</p><p className="mt-1 text-sm"><span className="num text-2xl text-amber-300">{d.yellowsTotal}</span> jaune{d.yellowsTotal > 1 ? 's' : ''} · <span className="num text-2xl text-red-300">{d.redsTotal}</span> rouge{d.redsTotal > 1 ? 's' : ''}</p><p className="mt-1 text-[11px] text-muted-foreground">Pas de cumul d’un match à l’autre.</p></div>
        <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-muted-foreground">À purger</p><p className="mt-1 text-sm"><span className={cn('num text-2xl', remaining ? 'text-red-300' : 'text-win')}>{remaining}</span> match{remaining > 1 ? 's' : ''}</p></div>
      </div>
      {d.suspensions.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <caption className="mb-1 text-left text-xs text-muted-foreground">Suspensions</caption>
          <thead><tr className="text-xs text-muted-foreground"><th className="py-1 text-left">Origine</th><th className="text-left">Décision</th><th className="text-center">Matchs</th><th className="text-right">Purgée</th></tr></thead>
          <tbody>{d.suspensions.map((s) => {
            const m = L.match.get(s.origin_match_id ?? '')
            const vs = m ? `${L.team.get(m.home_team_id)?.short_name}–${L.team.get(m.away_team_id)?.short_name}` : '—'
            const done = s.served.length >= s.matches
            return (
              <tr key={s.id} className="border-t border-white/5 align-top">
                <td className="py-1.5">{m ? <Link to={`/matchs/${m.id}`} className="hover:text-neon">{vs}</Link> : vs}<span className="block text-[11px] text-muted-foreground">{m ? fmtDate(m.date, 'd MMM') : ''}</span></td>
                <td>{SUSPENSION_LABEL[s.kind]}{s.start && s.kind === 'council' && <span className="block text-xs text-muted-foreground">le {fmtDate(s.start, 'd MMM yyyy')}</span>}</td>
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
