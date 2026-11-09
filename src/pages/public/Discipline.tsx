// Discipline : joueurs suspendus pour la prochaine journée, joueurs à 2 jaunes (menacés), officiels suspendus,
// classement fair-play des équipes. Calculé depuis les événements de match (Art. 11.5, 11.6, 2.5 ; Art. 17.3 critères 5 et 6).
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Ban, ShieldCheck, UserX } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useEffectiveSeason, useSeasonCompetitions } from '@/hooks/useStats'
import { useSeasonDiscipline, useSeasonRules } from '@/hooks/useDiscipline'
import { PageHeader } from '@/components/league/Bits'
import { TeamLogo, PlayerAvatar } from '@/components/league/Identity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArtLink } from '@/components/reglement/ArtLink'
import { REGLEMENT, SUSPENSION_LABEL, isDisputed, isThreatened, type PlayerDiscipline } from '@/lib/reglement'
import { phaseLabel } from '@/lib/disciplineLabels'
import { YellowCounter } from '@/components/reglement/YellowCounter'
import { cn } from '@/lib/utils'

export default function Discipline() {
  const { db } = useData()
  const L = useLookup()
  const season = useEffectiveSeason()
  const comps = useSeasonCompetitions()
  const rules = useSeasonRules(season?.id)
  const all = useSeasonDiscipline(season?.id)
  const [compId, setCompId] = useState<string>('all')
  const scoped = all.filter((c) => compId === 'all' || c.competition.id === compId)
  const players = scoped.flatMap((c) => [...c.players.values()].map((d) => ({ d, comp: c.competition })))
  const suspended = players.filter((x) => x.d.remaining > 0).sort((a, b) => b.d.remaining - a.d.remaining)
  const threatened = players.filter((x) => isThreatened(x.d))
  const officials = scoped.flatMap((c) => c.officials.filter((o) => o.record.served.length < o.record.matches).map((o) => ({ o, comp: c.competition })))

  // classement fair-play : moins de jaunes puis moins de rouges (critères 5 et 6 de l'Art. 17.3)
  const fair = useMemo(() => {
    const ids = new Set(comps.filter((c) => compId === 'all' || c.id === compId).map((c) => c.id))
    const ms = new Set(db.Match.filter((m) => ids.has(m.competition_id) && isDisputed(m)).map((m) => m.id))
    const rows = new Map<string, { team_id: string; yellow: number; red: number; played: number }>()
    for (const m of db.Match.filter((x) => ms.has(x.id))) for (const t of [m.home_team_id, m.away_team_id]) { const r = rows.get(t) ?? { team_id: t, yellow: 0, red: 0, played: 0 }; r.played++; rows.set(t, r) }
    for (const e of db.MatchEvent) {
      if (!ms.has(e.match_id)) continue
      const r = rows.get(e.team_id); if (!r) continue
      if (e.type === 'yellow_card' || e.type === 'second_yellow') r.yellow++
      if (e.type === 'red_card' || e.type === 'second_yellow') r.red++
    }
    return [...rows.values()].sort((a, b) => a.yellow - b.yellow || a.red - b.red || (L.team.get(a.team_id)?.name ?? '').localeCompare(L.team.get(b.team_id)?.name ?? ''))
  }, [db.Match, db.MatchEvent, comps, compId, L.team])

  return (
    <div className="space-y-6">
      <PageHeader title="Discipline" subtitle={`${season?.name ?? ''} · cartons et suspensions`}>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Compétition">
          {[{ id: 'all', label: 'Toutes' }, ...comps.map((c) => ({ id: c.id, label: phaseLabel(c) }))].map((c) => (
            <button key={c.id} onClick={() => setCompId(c.id)} aria-pressed={compId === c.id} className={cn('cursor-pointer rounded-full border px-3 py-1 text-xs font-bold uppercase', compId === c.id ? 'border-neon bg-neon/15 text-neon' : 'border-white/10 text-muted-foreground')}>{c.label}</button>
          ))}
        </div>
      </PageHeader>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-night-900/50 px-4 py-3 text-sm">
        {rules.cumulativeCards
          ? <><span><b>{REGLEMENT.cards.yellowsForSuspension} jaunes cumulés</b> sur la compétition = <b>1 match</b> de suspension</span><ArtLink art={REGLEMENT.cards.artYellow} /><span><b>Rouge</b> = au moins 1 match (Ardentia peut alourdir)</span><ArtLink art={REGLEMENT.cards.artRed} /><span className="text-muted-foreground">Les 2 jaunes d’une expulsion ne comptent pas dans le cumul.</span></>
          : <span className="text-muted-foreground">Cette saison suivait l’ancien règlement : pas de cumul automatique des jaunes, suspensions décidées au cas par cas.</span>}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Ban className="size-5 text-red-400" />Suspendus pour la prochaine journée</CardTitle></CardHeader><CardContent>
          {suspended.length || officials.length ? (
            <ul className="divide-y divide-white/5">
              {suspended.map(({ d, comp }) => <SuspendedRow key={`${comp.id}:${d.player_id}`} d={d} compName={compId === 'all' && comps.length > 1 ? phaseLabel(comp) : undefined} />)}
              {officials.map(({ o, comp }) => (
                <li key={o.record.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <UserX className="size-8 rounded-full bg-white/5 p-1.5 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1"><p className="font-semibold">{o.name} <span className="font-normal text-muted-foreground">· officiel · {L.team.get(o.team_id)?.short_name}</span></p><p className="text-xs text-muted-foreground">{SUSPENSION_LABEL[o.record.kind]}{compId === 'all' && comps.length > 1 ? ` · ${phaseLabel(comp)}` : ''}</p></div>
                  <ArtLink art={REGLEMENT.cards.artBench} />
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">Aucun joueur suspendu.</p>}
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-300" />Menacés de suspension ({REGLEMENT.cards.yellowsForSuspension - 1} jaunes)</CardTitle></CardHeader><CardContent>
          {threatened.length ? (
            <ul className="divide-y divide-white/5">
              {threatened.map(({ d, comp }) => {
                const p = L.player.get(d.player_id), t = L.team.get(d.team_id)
                return (
                  <li key={`${comp.id}:${d.player_id}`} className="flex items-center gap-3 py-2.5 text-sm">
                    <PlayerAvatar player={p} team={t} size={34} />
                    <Link to={`/joueurs/${d.player_id}`} className="min-w-0 flex-1 truncate font-semibold hover:text-neon">{p?.first_name} {p?.last_name} <span className="font-normal text-muted-foreground">· {t?.short_name}{compId === 'all' && comps.length > 1 ? ` · ${phaseLabel(comp)}` : ''}</span></Link>
                    <YellowCounter d={d} />
                  </li>
                )
              })}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">Aucun joueur à {REGLEMENT.cards.yellowsForSuspension - 1} jaunes.</p>}
          {rules.cumulativeCards && <ArtLink art={REGLEMENT.cards.artYellow} className="mt-2" />}
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-win" />Classement fair-play</CardTitle></CardHeader><CardContent>
        {fair.length ? (
          <table className="w-full text-sm">
            <caption className="mb-2 text-left text-xs text-muted-foreground">Moins de cartons jaunes, puis moins de cartons rouges — mêmes critères que le départage du classement (critères 5 et 6). <ArtLink art="17.3" /></caption>
            <thead><tr className="text-xs text-muted-foreground"><th className="w-10 py-1 text-left">#</th><th className="text-left">Équipe</th><th className="text-center" title="Matchs joués">MJ</th><th className="text-center" title="Cartons jaunes">CJ</th><th className="text-center" title="Cartons rouges">CR</th></tr></thead>
            <tbody>{fair.map((r, i) => (
              <tr key={r.team_id} className="border-t border-white/5">
                <td className="num py-2">{i + 1}</td>
                <td><Link to={`/equipes/${r.team_id}`} className="flex items-center gap-2 hover:text-neon"><TeamLogo team={L.team.get(r.team_id)} size={22} /><span className="font-semibold">{L.team.get(r.team_id)?.name}</span></Link></td>
                <td className="num text-center text-muted-foreground">{r.played}</td>
                <td className="num text-center text-amber-300">{r.yellow}</td>
                <td className="num text-center text-red-300">{r.red}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <p className="py-6 text-center text-sm text-muted-foreground">Aucun match joué pour l’instant.</p>}
      </CardContent></Card>
    </div>
  )
}

function SuspendedRow({ d, compName }: { d: PlayerDiscipline; compName?: string }) {
  const L = useLookup()
  const p = L.player.get(d.player_id), t = L.team.get(d.team_id)
  const open = d.suspensions.filter((s) => s.served.length < s.matches)
  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      <PlayerAvatar player={p} team={t} size={34} />
      <div className="min-w-0 flex-1">
        <Link to={`/joueurs/${d.player_id}`} className="block truncate font-semibold hover:text-neon">{p?.first_name} {p?.last_name} <span className="font-normal text-muted-foreground">· {t?.short_name}{compName ? ` · ${compName}` : ''}</span></Link>
        <p className="text-xs text-muted-foreground">{open.map((s) => `${SUSPENSION_LABEL[s.kind]}${s.reason ? ` (${s.reason})` : ''}`).join(' + ')}</p>
      </div>
      <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-200">{d.remaining} match{d.remaining > 1 ? 's' : ''}</span>
    </li>
  )
}
