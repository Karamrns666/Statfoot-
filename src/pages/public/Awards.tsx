import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CompetitionTabs } from '@/components/league/CompetitionTabs'
import { SeasonNotStarted } from '@/components/league/SeasonNotStarted'
import { FilterSelect } from '@/components/league/FilterSelect'
import { RewardsList } from '@/components/teamweek/RewardsList'
import { seasonMonths, seasonRounds, type Period } from '@/lib/rewards'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useEffectiveSeason, usePlayerXP, useRace } from '@/hooks/useStats'
import { PageHeader, RankDelta, RookieBadge, EmptyState } from '@/components/league/Bits'
import { PlayerAvatar, RoleBadge, TeamLogo } from '@/components/league/Identity'
import { AWARD_STYLE, TrophyBadge } from '@/components/awards/TrophyBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { competitionStandings, generalStandings, isRookie, race, AWARD_LABELS, type PhaseFilter, type PlayerXP, type Ranked, type RaceKey, type StandingRow } from '@/lib/stats'
import { playerName } from '@/lib/format'
import type { AwardCategory } from '@/types/entities'
import { cn } from '@/lib/utils'

const PHASES: { value: PhaseFilter; label: string }[] = [{ value: 'all', label: 'Toute la saison' }, { value: 'league_phase', label: 'Phase de ligue' }, { value: 'gold', label: 'Gold Cup' }, { value: 'silver', label: 'Silver Cup' }]

export default function Awards() {
  const { scopeSeasonId } = useSeason()
  const eff = useEffectiveSeason()
  const seasonId = scopeSeasonId ?? eff?.id ?? null
  const [phase, setPhase] = useState<PhaseFilter>('all')
  const scope = { seasonId, phase }
  const { db } = useData()
  const hasCups = db.Competition.some((c) => c.season_id === seasonId && (c.phase === 'gold' || c.phase === 'silver'))
  return (
    <div>
      <PageHeader title="Les Trophées" subtitle="Classements mis à jour automatiquement après chaque match" />
      <div className="mb-5 flex flex-wrap gap-2">
        {hasCups && PHASES.filter((x) => x.value === 'all' || db.Competition.some((c) => c.season_id === seasonId && c.phase === x.value)).map((p) => <button key={p.value} onClick={() => setPhase(p.value)} className={cn('rounded-full border px-4 py-1.5 font-display text-sm font-bold uppercase tracking-wide cursor-pointer', phase === p.value ? 'border-neon bg-neon/15 text-neon' : 'border-white/10 text-muted-foreground hover:text-white')}>{p.label}</button>)}
      </div>
      <Tabs defaultValue="race">
        <TabsList><TabsTrigger value="race">Course aux trophées</TabsTrigger><TabsTrigger value="rewards">Récompenses</TabsTrigger><TabsTrigger value="stats">Statistiques</TabsTrigger><TabsTrigger value="palmares">Palmarès</TabsTrigger></TabsList>
        <TabsContent value="rewards">{seasonId ? <RewardsByPeriod seasonId={seasonId} /> : null}</TabsContent>
        <TabsContent value="race" className="space-y-10">
          <PlayerRace scope={scope} raceKey="ballon_or" category="ballon_or" />
          <PlayerRace scope={scope} raceKey="golden_glove" category="golden_glove" />
          <PlayerRace scope={scope} raceKey="top_scorer" category="top_scorer" />
          <PlayerRace scope={scope} raceKey="top_assist" category="top_assist" />
          <TeamRace seasonId={seasonId} phase={phase} />
        </TabsContent>
        <TabsContent value="stats"><StatsLeaders seasonId={seasonId} phase={phase} /></TabsContent>
        <TabsContent value="palmares"><Palmares /></TabsContent>
      </Tabs>
    </div>
  )
}

function metric(key: RaceKey, s: PlayerXP) {
  if (key === 'top_scorer') return { v: s.goals, u: 'buts' }
  if (key === 'top_assist') return { v: s.assists, u: 'passes' }
  return { v: s.xp, u: 'XP' }
}

function PlayerRace({ scope, raceKey, category }: { scope: { seasonId: string | null; phase: PhaseFilter }; raceKey: RaceKey; category: AwardCategory }) {
  const L = useLookup()
  const list = useRace(scope, raceKey)
  const st = AWARD_STYLE[category]
  const top = list[0]
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <TrophyBadge category={category} size={52} />
        <div><h2 className="title-caps text-3xl" style={{ color: st.color }}>{st.label}</h2><p className="text-xs text-muted-foreground">{st.criteria}</p></div>
      </div>
      {!top ? <EmptyState title="Non attribué">Aucun joueur éligible pour l'instant.</EmptyState> : (
        <div className="grid gap-4 lg:grid-cols-5">
          <HeroCard r={top} raceKey={raceKey} color={st.color} />
          <Card className="lg:col-span-3">
            <CardContent className="divide-y divide-white/5 p-2 sm:p-3">
              {list.slice(0, 5).map((r) => {
                const p = L.player.get(r.item.player_id), t = L.team.get(r.item.team_id), m = metric(raceKey, r.item)
                return (
                  <Link key={r.item.player_id} to={`/joueurs/${r.item.player_id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-white/[.03]">
                    <div className="w-8 text-center"><div className="num text-xl" style={{ color: r.rank === 1 ? st.color : undefined }}>{r.rank}</div><RankDelta delta={r.delta} /></div>
                    <PlayerAvatar player={p} team={t} size={38} />
                    <div className="min-w-0 flex-1"><div className="truncate font-semibold">{playerName(p)}</div><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TeamLogo team={t} size={14} />{t?.short_name}{p && isRookie(p) && <RookieBadge />}</div></div>
                    {raceKey === 'golden_glove'
                      ? <div className="grid grid-cols-4 gap-2 text-center text-[10px] uppercase text-muted-foreground"><div><div className="num text-base text-white">{r.item.gk_matches}</div>MJ</div><div><div className="num text-base text-white">{r.item.clean_sheets}</div>CS</div><div><div className="num text-base text-white">{r.item.saves}</div>Arr.</div><div><div className="num text-base text-white">{r.item.conceded}</div>BC</div></div>
                      : <div className="hidden gap-3 text-center text-[10px] uppercase text-muted-foreground sm:flex"><div><div className="num text-base text-white">{r.item.matches}</div>MJ</div><div><div className="num text-base text-white">{r.item.goals}</div>Buts</div><div><div className="num text-base text-white">{r.item.assists}</div>Passes</div></div>}
                    <div className="w-16 text-right"><span className="num text-2xl" style={{ color: st.color }}>{m.v}</span><div className="text-[10px] uppercase text-muted-foreground">{m.u}</div></div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}

function HeroCard({ r, raceKey, color }: { r: Ranked<PlayerXP>; raceKey: RaceKey; color: string }) {
  const L = useLookup()
  const p = L.player.get(r.item.player_id), t = L.team.get(r.item.team_id), m = metric(raceKey, r.item)
  return (
    <Link to={`/joueurs/${p?.id}`} className="relative overflow-hidden rounded-3xl border p-5 lg:col-span-2" style={{ borderColor: `${color}55`, background: `radial-gradient(ellipse 80% 70% at 50% 0%, ${color}38, transparent 70%), linear-gradient(180deg,#0D2B66,#04163D)`, boxShadow: `0 0 50px -20px ${color}` }}>
      <div className="flex items-start justify-between"><span className="num text-5xl" style={{ color, textShadow: `0 0 20px ${color}` }}>#1</span><RankDelta delta={r.delta} /></div>
      <div className="mt-2 flex flex-col items-center text-center">
        <PlayerAvatar player={p} team={t} size={112} />
        <div className="title-caps mt-4 text-3xl leading-none">{p?.first_name}<br /><span style={{ color }}>{p?.last_name}</span></div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground"><TeamLogo team={t} size={20} />{t?.name}{p && <RoleBadge position={p.position} captain={p.is_captain} />}</div>
        {p && isRookie(p) && <div className="mt-2"><RookieBadge /></div>}
        <div className="mt-4 grid w-full grid-cols-4 gap-2 rounded-2xl bg-black/20 p-3 text-center">
          {raceKey === 'golden_glove'
            ? [['MJ', r.item.gk_matches], ['CS', r.item.clean_sheets], ['Arrêts', r.item.saves], ['BC', r.item.conceded]].map(([l, v]) => <div key={l}><div className="num text-2xl">{v}</div><div className="text-[10px] uppercase text-muted-foreground">{l}</div></div>)
            : [['MJ', r.item.matches], ['Buts', r.item.goals], ['Passes', r.item.assists], ['XP', r.item.xp]].map(([l, v]) => <div key={l}><div className="num text-2xl">{v}</div><div className="text-[10px] uppercase text-muted-foreground">{l}</div></div>)}
        </div>
        <div className="mt-3 text-sm text-muted-foreground"><span className="num text-3xl" style={{ color }}>{m.v}</span> {m.u}</div>
      </div>
    </Link>
  )
}

function TeamRace({ seasonId, phase }: { seasonId: string | null; phase: PhaseFilter }) {
  const { db, league } = useData()
  const L = useLookup()
  const rows: StandingRow[] = useMemo(() => {
    if (!seasonId) return []
    if (phase === 'all') return generalStandings(league, seasonId)
    const c = db.Competition.find((x) => x.season_id === seasonId && x.phase === phase)
    return c ? competitionStandings(league, c.id) : []
  }, [league, db.Competition, seasonId, phase])
  const valid = rows.filter((r) => r.played > 0 && r.points > 0)
  const st = AWARD_STYLE.best_team
  const top = valid[0]
  const t = top ? L.team.get(top.team_id) : undefined
  return (
    <section>
      <div className="mb-4 flex items-center gap-3"><TrophyBadge category="best_team" size={52} /><div><h2 className="title-caps text-3xl" style={{ color: st.color }}>{st.label}</h2><p className="text-xs text-muted-foreground">Classement général de la saison</p></div></div>
      {!top ? <EmptyState title="Non attribué" /> : (
        <div className="grid gap-4 lg:grid-cols-5">
          <Link to={`/equipes/${t?.id}`} className="relative flex flex-col items-center overflow-hidden rounded-3xl border p-6 text-center lg:col-span-2" style={{ borderColor: `${st.color}55`, background: `radial-gradient(ellipse 80% 70% at 50% 0%, ${st.color}33, transparent 70%), linear-gradient(180deg,#0D2B66,#04163D)` }}>
            <span className="num self-start text-5xl" style={{ color: st.color }}>#1</span>
            <TeamLogo team={t} size={120} />
            <div className="title-caps mt-3 text-3xl">{t?.name}</div>
            <div className="text-sm text-muted-foreground">{t?.company}</div>
            <div className="mt-4 grid w-full grid-cols-4 gap-2 rounded-2xl bg-black/20 p-3">{[['MJ', top.played], ['V', top.won], ['DIFF', top.gd], ['PTS', top.points]].map(([l, v]) => <div key={l}><div className="num text-2xl">{v}</div><div className="text-[10px] uppercase text-muted-foreground">{l}</div></div>)}</div>
          </Link>
          <Card className="lg:col-span-3"><CardContent className="divide-y divide-white/5 p-2 sm:p-3">
            {valid.slice(0, 5).map((r) => { const tt = L.team.get(r.team_id); return (
              <Link key={r.team_id} to={`/equipes/${r.team_id}`} className="flex items-center gap-3 px-2 py-3 hover:bg-white/[.03]">
                <span className="num w-8 text-center text-xl">{r.rank}</span><TeamLogo team={tt} size={34} /><span className="flex-1 truncate font-semibold">{tt?.name}</span>
                <span className="text-xs text-muted-foreground">{r.played} MJ · {r.gd > 0 ? '+' : ''}{r.gd}</span><span className="num w-14 text-right text-2xl" style={{ color: st.color }}>{r.points}</span>
              </Link>) })}
          </CardContent></Card>
        </div>
      )}
    </section>
  )
}

function StatsLeaders({ seasonId, phase }: { seasonId: string | null; phase: PhaseFilter }) {
  const { league } = useData()
  const L = useLookup()
  const list = [...usePlayerXP({ seasonId, phase }).values()]
  const cats: { title: string; key: keyof PlayerXP; filter?: (s: PlayerXP) => boolean }[] = [
    { title: 'Buts', key: 'goals' }, { title: 'Passes décisives', key: 'assists' }, { title: 'XP', key: 'xp' },
    { title: 'Clean sheets', key: 'clean_sheets', filter: (s) => s.gk_matches > 0 }, { title: 'Arrêts', key: 'saves', filter: (s) => s.gk_matches > 0 },
    { title: 'Cartons jaunes', key: 'yellow' }, { title: 'Matchs joués', key: 'matches' },
  ]
  void race; void league
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cats.map((c) => {
        const top = list.filter((s) => (c.filter ? c.filter(s) : true) && (s[c.key] as number) > 0).sort((a, b) => (b[c.key] as number) - (a[c.key] as number)).slice(0, 5)
        return (
          <Card key={c.title}><CardHeader><CardTitle>{c.title}</CardTitle></CardHeader><CardContent className="space-y-1">
            {top.map((s, i) => { const p = L.player.get(s.player_id); return (
              <Link key={s.player_id} to={`/joueurs/${s.player_id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5">
                <span className="num w-5 text-muted-foreground">{i + 1}</span><PlayerAvatar player={p} team={L.team.get(s.team_id)} size={26} /><span className="flex-1 truncate">{playerName(p)}</span><span className="num text-lg">{s[c.key] as number}</span>
              </Link>) })}
            {!top.length && <p className="text-sm text-muted-foreground">—</p>}
          </CardContent></Card>
        )
      })}
    </div>
  )
}

export function Palmares() {
  const { db } = useData()
  const L = useLookup()
  const seasons = [...db.Season].sort((a, b) => b.start_date.localeCompare(a.start_date))
  const published = db.Award.filter((a) => a.status === 'published')
  if (!published.length) return <EmptyState title="Aucun palmarès publié">Les trophées de fin de saison apparaissent ici une fois validés et publiés.</EmptyState>
  return (
    <div className="space-y-8">
      {seasons.map((s) => {
        const aw = published.filter((a) => a.season_id === s.id && (a.scope ?? 'season') === 'season')
        if (!aw.length) return null
        return (
          <section key={s.id}>
            <h2 className="title-caps mb-3 text-2xl">{s.name}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {aw.map((a) => {
                const st = AWARD_STYLE[a.category], p = a.player_id ? L.player.get(a.player_id) : undefined, t = L.team.get(a.team_id ?? '')
                return (
                  <div key={a.id} className="glass flex flex-col items-center rounded-2xl p-4 text-center">
                    <TrophyBadge category={a.category} size={56} />
                    <div className="title-caps mt-3 text-sm" style={{ color: st.color }}>{AWARD_LABELS[a.category]}</div>
                    {a.not_awarded ? <div className="mt-1 text-sm text-muted-foreground">Non attribué</div> : <>
                      <div className="mt-1 font-semibold">{p ? playerName(p) : t?.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><TeamLogo team={t} size={14} />{p ? t?.short_name : t?.company}</div>
                    </>}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/** Récompenses par journée, par mois ou sur la saison, avec filtre de compétition */
function RewardsByPeriod({ seasonId }: { seasonId: string }) {
  const { db, league } = useData()
  const [kind, setKind] = useState<'round' | 'month' | 'season'>('round')
  const [comp, setComp] = useState('')
  const comps = db.Competition.filter((c) => c.season_id === seasonId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const rounds = seasonRounds(league, seasonId, comp || null)
  const months = seasonMonths(league, seasonId, comp || null)
  const [round, setRound] = useState<number | null>(null)
  const [month, setMonth] = useState('')
  const r = round && rounds.includes(round) ? round : rounds.at(-1)
  const mo = month && months.includes(month) ? month : months.at(-1)
  if (!rounds.length) return <SeasonNotStarted what="Les récompenses" />
  const period: Period = kind === 'round' ? { type: 'round', round: r! } : kind === 'month' ? { type: 'month', month: mo! } : { type: 'season' }
  const monthName = (m: string) => format(new Date(`${m}-01T12:00:00`), 'MMMM yyyy', { locale: fr })
  return (
    <div className="space-y-4">
      {comps.length > 1 && <CompetitionTabs comps={comps} value={comp} onChange={setComp} />}
      <div className="flex flex-wrap items-center gap-2">
        {([['round', 'Par journée'], ['month', 'Par mois'], ['season', 'Saison']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={cn('cursor-pointer rounded-full border px-4 py-1.5 text-sm font-bold transition', kind === k ? 'border-white bg-white text-ink' : 'border-white/15 text-muted-foreground hover:text-white')}>{l}</button>
        ))}
        {kind === 'round' && <FilterSelect label="Journée" value={String(r)} onChange={(v) => setRound(Number(v))} allLabel={null} options={rounds.map((x) => ({ value: String(x), label: `Journée ${x}` }))} />}
        {kind === 'month' && <FilterSelect label="Mois" value={mo ?? ''} onChange={setMonth} allLabel={null} options={months.map((x) => ({ value: x, label: monthName(x) }))} />}
      </div>
      <h3 className="font-display text-2xl font-black first-letter:uppercase">{kind === 'round' ? `Journée ${r}` : kind === 'month' ? monthName(mo!) : 'Toute la saison'}</h3>
      <RewardsList seasonId={seasonId} period={period} competitionId={comp || null} />
    </div>
  )
}
