// Pré-saison (système suisse) — structure du fichier de référence :
// Comment ça marche · Journées 1 à N + Rattrapage (matchs, « Pts avant », score, « Pourquoi ce match ? », équipe au repos,
// classement après la journée) · Classement (MASTER / CHALLENGER, force des adversaires) · Parcours par équipe.
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BedDouble, Calculator, CalendarDays, Layers, Scale, Shuffle, Trophy } from 'lucide-react'
import { useLookup } from '@/hooks/useData'
import { useEffectiveSeason } from '@/hooks/useStats'
import { usePreseason, type PreseasonView } from '@/hooks/usePreseason'
import { EmptyState, PageHeader } from '@/components/league/Bits'
import { TeamLogo } from '@/components/league/Identity'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DivisionMark, PreseasonTable } from '@/components/preseason/PreseasonTable'
import { CRITERION_LABEL, preseasonRanking, teamPath } from '@/lib/preseason'
import { competitionNames } from '@/lib/competitionNames'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function Preseason() {
  const season = useEffectiveSeason()
  const v = usePreseason(season?.id)
  const [params, setParams] = useSearchParams()
  if (!v) return <EmptyState title="Pas de pré-saison pour cette saison" />
  const tab = params.get('onglet') ?? (v.matches.length ? 'journees' : 'fonctionnement')
  return (
    <div>
      <PageHeader title="Pré-saison" subtitle={`${season?.name ?? ''} · système suisse · ${v.teamIds.length} équipes · ${v.state.format.total} matchs`} />
      <Tabs value={tab} onValueChange={(t) => setParams((p) => { p.set('onglet', t); return p }, { replace: true })}>
        <TabsList className="flex-wrap"><TabsTrigger value="fonctionnement">Comment ça marche</TabsTrigger><TabsTrigger value="journees">Journées</TabsTrigger><TabsTrigger value="classement">Classement</TabsTrigger><TabsTrigger value="parcours">Parcours par équipe</TabsTrigger></TabsList>
        <TabsContent value="fonctionnement"><HowItWorks v={v} /></TabsContent>
        <TabsContent value="journees"><Rounds v={v} /></TabsContent>
        <TabsContent value="classement"><Ranking v={v} /></TabsContent>
        <TabsContent value="parcours"><Paths v={v} /></TabsContent>
      </Tabs>
    </div>
  )
}

/** Rangs du classement à afficher : figé à la clôture, sinon en cours. */
export function displayRanking(v: PreseasonView) {
  if (!v.ps.final_ranking) return v.state.ranking
  const by = new Map(v.state.ranking.map((r) => [r.team_id, r]))
  return v.ps.final_ranking.map((id, i) => ({ ...by.get(id)!, rank: i + 1 })).filter((r) => r.team_id)
}

function HowItWorks({ v }: { v: PreseasonView }) {
  const f = v.state.format, n = competitionNames()
  const m = v.ps.split?.master_size ?? v.cfg.masterSize
  const items = [
    { icon: Shuffle, title: 'Journée 1', text: `Tirage au sort intégral : les ${f.perRound * 2} premières équipes tirées jouent ${f.perRound} matchs (1re contre 2e, 3e contre 4e…).${f.resting ? ` La ${f.teams}e est au repos.` : ''}` },
    { icon: Layers, title: `Journées 2 à ${v.cfg.rounds}`, text: 'On classe les équipes, puis on fait jouer ensemble celles qui ont le même nombre de points (1re contre 2e, 3e contre 4e…). Sinon, l’adversaire au total de points le plus proche. On ne rejoue jamais une équipe déjà rencontrée.' },
    ...(f.resting ? [
      { icon: BedDouble, title: 'Équipe au repos', text: 'À chaque journée, c’est l’équipe la moins bien classée (qui n’a pas encore été au repos) qui ne joue pas. Elle ne perd rien : elle rattrape son match à la fin.' },
      { icon: CalendarDays, title: 'Rattrapage', text: `Les ${v.cfg.rounds} équipes qui ont été au repos jouent ${f.catchup} matchs entre elles. Ainsi, tout le monde a joué exactement ${f.matchesPerTeam} matchs.` },
    ] : []),
    { icon: Calculator, title: 'Points', text: `Victoire = ${v.cfg.points.win} · Nul = ${v.cfg.points.draw} · Défaite = ${v.cfg.points.loss} (forfait = 3-0).` },
    { icon: Scale, title: 'Départager les égalités', text: `${v.cfg.finalOrder.map((c, i) => `${i + 1}) ${CRITERION_LABEL[c]}`).join('  ')}. Force des adversaires = total des points des équipes rencontrées : plus il est élevé, plus le parcours a été difficile. Pas de confrontation directe ni de cartons en pré-saison.` },
    { icon: Trophy, title: 'Divisions', text: `Rangs 1 à ${m} → ${n.gold} · rangs ${m + 1} à ${f.teams} → ${n.silver}. Ensuite, ${n.gold} et ${n.silver} suivent le classement du règlement (Art. 17.3).` },
    { icon: CalendarDays, title: 'Le calendrier', text: `${v.cfg.rounds} journées de ${f.perRound} matchs${f.catchup ? ` + 1 journée de rattrapage de ${f.catchup} matchs` : ''} = ${f.total} matchs.` },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <article key={it.title} className="glass rounded-2xl p-4">
          <h3 className="flex items-center gap-2 font-display text-xl font-black"><it.icon className="size-5 text-neon" aria-hidden />{it.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-white/80">{it.text}</p>
        </article>
      ))}
      <article className="glass flex items-center gap-4 rounded-2xl p-4 sm:col-span-2 lg:col-span-3">
        <DivisionMark div="master" size={56} label={false} /><DivisionMark div="challenger" size={56} label={false} />
        <p className="text-sm text-white/80">À la clôture, le classement final est figé : <b className="text-[#E8B931]">{n.gold}</b> ({m} équipes) et <b className="text-[#7FB2E5]">{n.silver}</b> ({f.teams - m} équipes).</p>
      </article>
    </div>
  )
}

function Rounds({ v }: { v: PreseasonView }) {
  const L = useLookup()
  const published = [...new Set(v.matches.map((m) => m.round ?? 0))].filter(Boolean).sort((a, b) => a - b)
  const [sel, setSel] = useState<number | null>(null)
  const round = sel ?? published.filter((r) => v.matches.some((m) => m.round === r && v.pm.find((p) => p.id === m.id)?.played)).at(-1) ?? published.at(-1)
  const before = useMemo(() => (round ? new Map(preseasonRanking(v.teamIds, v.pm.filter((m) => m.round < round), { order: v.cfg.intermediateOrder, drawOrder: v.drawOrder, points: v.cfg.points }).map((r) => [r.team_id, r.points])) : new Map()), [v, round])
  const after = useMemo(() => (round ? preseasonRanking(v.teamIds, v.pm.filter((m) => m.round <= round), { order: round > v.cfg.rounds ? v.cfg.finalOrder : v.cfg.intermediateOrder, drawOrder: v.drawOrder, points: v.cfg.points }) : []), [v, round])
  if (!published.length) return <EmptyState title="La pré-saison n’a pas encore commencé">Les matchs de la journée 1 apparaîtront ici après le tirage au sort.</EmptyState>
  const ms = v.matches.filter((m) => m.round === round)
  const rest = round ? v.rests[round] : undefined
  const anyPlayed = ms.some((m) => v.pm.find((p) => p.id === m.id)?.played)
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Journée">
        {Array.from({ length: v.totalRounds }, (_, i) => i + 1).map((r) => (
          <button key={r} role="tab" aria-selected={r === round} disabled={!published.includes(r)} onClick={() => setSel(r)} className={cn('cursor-pointer rounded-xl border px-4 py-2 font-display text-lg font-black uppercase leading-none transition disabled:cursor-not-allowed disabled:opacity-35', r === round ? 'border-neon bg-neon text-white' : 'border-white/15 text-muted-foreground hover:text-white')}>{v.shortLabel(r)}</button>
        ))}
      </div>
      <section>
        <h2 className="title-caps text-2xl">{v.roundLabel(round!)}</h2>
        <p className="text-sm text-muted-foreground">{round === 1 ? 'Tirage au sort intégral' : round! > v.cfg.rounds ? 'Les équipes au repos jouent leur dernier match' : 'Les équipes avec le même nombre de points se rencontrent'}{ms[0]?.date ? ` · ${fmtDate(ms[0].date, 'EEEE d MMMM')}` : ''}</p>
        {/* ordinateur : tableau comme le fichier de référence */}
        <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
          <table className="w-full text-sm">
            <thead className="bg-white/[.03] text-[11px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-2 py-2 text-left">Match</th><th className="text-right">Équipe A</th><th className="px-2 text-center">Pts avant</th><th className="px-2 text-center">Score</th><th className="px-2 text-center">Pts avant</th><th className="text-left">Équipe B</th><th className="px-2 text-left">Pourquoi ce match ?</th></tr></thead>
            <tbody>
              {ms.map((m, i) => {
                const p = v.pm.find((x) => x.id === m.id)!
                return (
                  <tr key={m.id} className="border-t border-white/5">
                    <td className="num px-2 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="text-right"><Link to={`/equipes/${m.home_team_id}`} className="inline-flex items-center gap-2 font-semibold hover:text-neon">{L.team.get(m.home_team_id)?.name}<TeamLogo team={L.team.get(m.home_team_id)} size={24} /></Link></td>
                    <td className="num px-2 text-center text-muted-foreground">{before.get(m.home_team_id) ?? 0}</td>
                    <td className="px-2 text-center"><Link to={`/matchs/${m.id}`} className={cn('num inline-block min-w-16 rounded-lg px-2 py-0.5 text-lg font-black', p.played ? 'bg-white text-[#0B2E73]' : 'text-muted-foreground')}>{p.played ? `${p.hs} - ${p.as}` : m.date ? fmtDate(m.date, 'HH:mm') : 'vs'}</Link></td>
                    <td className="num px-2 text-center text-muted-foreground">{before.get(m.away_team_id) ?? 0}</td>
                    <td><Link to={`/equipes/${m.away_team_id}`} className="inline-flex items-center gap-2 font-semibold hover:text-neon"><TeamLogo team={L.team.get(m.away_team_id)} size={24} />{L.team.get(m.away_team_id)?.name}</Link></td>
                    <td className="px-2 text-muted-foreground">{m.pairing_reason ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* mobile : cartes */}
        <ul className="mt-3 space-y-2 md:hidden">
          {ms.map((m) => {
            const p = v.pm.find((x) => x.id === m.id)!
            return (
              <li key={m.id} className="glass rounded-xl p-3">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="min-w-0 text-right"><div className="break-words text-[13px] font-semibold leading-tight">{L.team.get(m.home_team_id)?.name}</div><div className="text-[11px] text-muted-foreground">{before.get(m.home_team_id) ?? 0} pts avant</div></div>
                  <Link to={`/matchs/${m.id}`} className={cn('num rounded-lg px-2 py-1 text-center text-lg font-black', p.played ? 'bg-white text-[#0B2E73]' : 'text-muted-foreground')}>{p.played ? `${p.hs} - ${p.as}` : m.date ? fmtDate(m.date, 'HH:mm') : 'vs'}</Link>
                  <div className="min-w-0"><div className="break-words text-[13px] font-semibold leading-tight">{L.team.get(m.away_team_id)?.name}</div><div className="text-[11px] text-muted-foreground">{before.get(m.away_team_id) ?? 0} pts avant</div></div>
                </div>
                <p className="mt-1.5 text-center text-[11px] text-muted-foreground">{m.pairing_reason}</p>
              </li>
            )
          })}
        </ul>
        {rest && <p className="mt-3 text-sm">Au repos : <Link to={`/equipes/${rest}`} className="font-bold hover:text-neon">{L.team.get(rest)?.name}</Link> → jouera au rattrapage</p>}
      </section>
      {anyPlayed && (
        <section>
          <h3 className="title-caps mb-2 text-xl">Classement après {round! > v.cfg.rounds ? 'le rattrapage' : `la journée ${round}`}</h3>
          <PreseasonTable rows={after} masterSize={v.ps.split?.master_size ?? v.cfg.masterSize} final={!!v.ps.final_ranking && round === v.totalRounds} />
        </section>
      )}
    </div>
  )
}

function Ranking({ v }: { v: PreseasonView }) {
  const rows = displayRanking(v)
  const n = competitionNames(), m = v.ps.split?.master_size ?? v.cfg.masterSize
  return (
    <div className="space-y-3">
      <h2 className="title-caps text-2xl">{v.ps.final_ranking ? 'Classement final de la pré-saison' : 'Classement en cours'}</h2>
      <p className="text-sm text-muted-foreground">{v.ps.final_ranking ? `Après les ${v.state.format.total} matchs — découpage en 2 divisions : ${n.gold} (${m} équipes) · ${n.silver} (${rows.length - m} équipes).` : `Zone ${n.gold} / ${n.silver} provisoire, figée à la clôture de la pré-saison.`} Départage : {(v.ps.final_ranking || v.state.finished ? v.cfg.finalOrder : v.cfg.intermediateOrder).map((c) => CRITERION_LABEL[c]).join(' › ')}.</p>
      <PreseasonTable rows={rows} masterSize={m} final={!!v.ps.final_ranking} />
      <p className="text-xs text-muted-foreground">Force des adversaires = total des points actuels des équipes déjà rencontrées. Plus il est élevé, plus le parcours a été difficile.</p>
    </div>
  )
}

/** Parcours d'une équipe (aussi utilisé sur la page de l'équipe). */
export function TeamPathCard({ v, teamId, compact = false }: { v: PreseasonView; teamId: string; compact?: boolean }) {
  const L = useLookup()
  const rows = displayRanking(v)
  const row = rows.find((r) => r.team_id === teamId)
  const m = v.ps.split?.master_size ?? v.cfg.masterSize
  const path = teamPath(teamId, v.pm, v.rests, v.cfg.rounds, (id) => L.team.get(id)?.name ?? id)
  const t = L.team.get(teamId)
  const tone = { W: 'border-win/40 bg-win/10', D: 'border-white/20 bg-white/5', L: 'border-red-400/30 bg-red-500/10' } as const
  return (
    <article className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <TeamLogo team={t} size={compact ? 32 : 40} />
        <div className="min-w-0 flex-1"><Link to={`/equipes/${teamId}`} className="block truncate font-display text-lg font-black hover:text-neon">{t?.name}</Link>
          <div className="text-xs text-muted-foreground">{row ? `${row.rank}e · ${row.points} pts${row.played ? ` · force ${row.force}` : ''}` : '—'}</div></div>
        {row && row.played > 0 && <DivisionMark div={row.rank <= m ? 'master' : 'challenger'} size={26} className="text-xs" label={!compact} />}
      </div>
      <ol className="mt-3 grid gap-1.5">
        {path.lines.map((l) => <li key={`${l.round}-${l.opp}`} className={cn('rounded-lg border px-2.5 py-1.5 text-sm', l.result ? tone[l.result as keyof typeof tone] : 'border-dashed border-white/15 text-muted-foreground')}>{l.text}</li>)}
        {!path.lines.length && <li className="text-sm text-muted-foreground">Aucun match publié.</li>}
      </ol>
      {path.rest && <p className="mt-2 text-xs text-muted-foreground">Au repos : {v.shortLabel(path.rest)} → match rattrapé à la fin</p>}
    </article>
  )
}

function Paths({ v }: { v: PreseasonView }) {
  const rows = displayRanking(v)
  if (!v.matches.length) return <EmptyState title="Aucun match publié">Le parcours de chaque équipe s’affichera dès la journée 1.</EmptyState>
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((r) => <TeamPathCard key={r.team_id} v={v} teamId={r.team_id} />)}</div>
}
