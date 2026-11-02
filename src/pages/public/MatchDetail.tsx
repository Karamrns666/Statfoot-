import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, MapPin, Whistle, Star, Vote, ArrowRightLeft, Share2, ShieldAlert } from '@/components/match/icons'
import { useData, useLookup } from '@/hooks/useData'
import { useNow } from '@/hooks/useNow'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CompetitionBadge, EmptyState, FormPills, LiveDot } from '@/components/league/Bits'
import { PlayerAvatar, PlayerLink, TeamLogo } from '@/components/league/Identity'
import { PitchLineup } from '@/components/match/PitchLineup'
import { MotmVoteWidget } from '@/components/match/MotmVoteWidget'
import { ShareVisualsDialog } from '@/components/share/ShareVisualsDialog'
import { EVENT_LABEL, fmtDate, fmtDateTime, playerShort, STATUS_LABEL } from '@/lib/format'
import { STAGE_LABELS } from '@/lib/schedule'
import { byDate, competitionStandings, headToHead, isPlayed, matchScorers, playerMatchLines, resultFor, teamStatsFromEvents } from '@/lib/stats'
import { fmtClock, liveElapsedMs, possessionPct } from '@/lib/live'
import type { Match, MatchEvent } from '@/types/entities'
import { cn } from '@/lib/utils'

const TIMELINE_TYPES: MatchEvent['type'][] = ['goal', 'penalty_goal', 'own_goal', 'penalty_missed', 'penalty_saved', 'yellow_card', 'red_card', 'substitution', 'goal_disallowed']

export default function MatchDetail() {
  const { id } = useParams()
  const { db, league } = useData()
  const L = useLookup()
  const now = useNow(1000)
  const [share, setShare] = useState(false)
  const m = db.Match.find((x) => x.id === id)
  const events = useMemo(() => db.MatchEvent.filter((e) => e.match_id === id).sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0)), [db.MatchEvent, id])
  if (!m) return <EmptyState title="Match introuvable"><Link to="/matchs" className="text-neon">Retour aux matchs</Link></EmptyState>
  const home = L.team.get(m.home_team_id), away = L.team.get(m.away_team_id)
  const comp = L.competition.get(m.competition_id)
  const venue = m.venue_id ? L.venue.get(m.venue_id) : undefined
  const scorers = matchScorers(m, events)
  const live = m.status === 'live'
  const showScore = live || m.status === 'finished'
  const motm = m.motm_player_id ? L.player.get(m.motm_player_id) : undefined
  const lineups = { home: db.Lineup.find((l) => l.match_id === m.id && l.team_id === m.home_team_id), away: db.Lineup.find((l) => l.match_id === m.id && l.team_id === m.away_team_id) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm"><Link to="/matchs"><ArrowLeft />Matchs</Link></Button>
        {showScore && <Button variant="outline" size="sm" onClick={() => setShare(true)}><Share2 />Visuels à partager</Button>}
      </div>
      {/* EN-TÊTE */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 50% 90% at 0% 50%, ${home?.primary_color}33, transparent 70%), radial-gradient(ellipse 50% 90% at 100% 50%, ${away?.primary_color}33, transparent 70%), linear-gradient(180deg,#14254a,#0b1426)` }} />
        <div className="relative">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-sm">
            <CompetitionBadge competition={comp} />
            <span className="text-muted-foreground">{m.stage && m.stage !== 'league' ? STAGE_LABELS[m.stage] : `Journée ${m.round}`}</span>
            {live ? <LiveDot label={m.live?.period === 'HT' ? 'Mi-temps' : `En direct · ${fmtClock(liveElapsedMs(m, now))}`} /> : <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold uppercase', m.status === 'finished' ? 'bg-white/10' : m.status === 'postponed' ? 'bg-amber-400/15 text-amber-300' : 'bg-neon/10 text-neon')}>{STATUS_LABEL[m.status]}</span>}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:gap-8">
            <TeamBlock team={home} />
            <div className="flex flex-col items-center pt-2">
              {showScore ? (
                <div className={cn('num flex items-center gap-2 text-6xl sm:text-8xl', live && 'text-red-400')}>
                  <span>{m.home_score ?? 0}</span><span className="text-4xl text-white/30">-</span><span>{m.away_score ?? 0}</span>
                </div>
              ) : <div className="num text-4xl text-neon sm:text-6xl">{fmtDate(m.date, 'HH:mm')}</div>}
              {m.home_ht_score != null && showScore && <div className="mt-1 text-xs text-muted-foreground">Mi-temps {m.home_ht_score}-{m.away_ht_score}</div>}
              {m.penalties && <div className="mt-1 rounded bg-white/10 px-2 text-xs font-semibold">Tirs au but {m.home_pens}-{m.away_pens}</div>}
              {m.extra_time && <div className="mt-1 text-[11px] text-muted-foreground">après prolongation</div>}
            </div>
            <TeamBlock team={away} />
          </div>
          {showScore && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <ScorerList list={scorers.home} align="right" />
              <ScorerList list={scorers.away} align="left" />
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-white/10 pt-4 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1.5 capitalize"><CalendarDays className="size-4" />{fmtDateTime(m.date)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{venue?.name ?? '—'} · {m.pitch}</span>
            {m.referee && <span className="inline-flex items-center gap-1.5"><Whistle className="size-4" />{m.referee}</span>}
          </div>
        </div>
      </section>

      <Tabs defaultValue={showScore ? 'summary' : 'preview'}>
        <TabsList>
          <TabsTrigger value="summary">Résumé</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="lineups">Compositions</TabsTrigger>
          <TabsTrigger value="preview">Avant-match</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Star className="size-5 text-award-gold" />Homme du match</CardTitle></CardHeader>
                <CardContent>
                  {motm ? <MotmCard match={m} playerId={motm.id} /> : <p className="text-sm text-muted-foreground">{showScore ? 'Pas encore désigné.' : 'Désigné après le match.'}</p>}
                </CardContent>
              </Card>
              {m.motm_vote_open && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Vote className="size-5 text-neon" />Vote du public</CardTitle></CardHeader><CardContent><MotmVoteWidget match={m} /></CardContent></Card>}
            </div>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Déroulé du match</CardTitle></CardHeader>
              <CardContent><Timeline match={m} events={events} /></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats"><MatchStats match={m} events={events} now={now} /></TabsContent>

        <TabsContent value="lineups">
          <div className="grid gap-6 md:grid-cols-2">
            <PitchLineup lineup={lineups.home} team={home} highlight={(pid) => tagFor(pid, events, m)} />
            <PitchLineup lineup={lineups.away} team={away} highlight={(pid) => tagFor(pid, events, m)} />
          </div>
        </TabsContent>

        <TabsContent value="preview"><PreMatch match={m} /></TabsContent>
      </Tabs>
      {share && <ShareVisualsDialog open={share} onOpenChange={setShare} match={m} />}
      <span className="hidden">{league.matches.length}</span>
    </div>
  )
}

function tagFor(pid: string, events: MatchEvent[], m: Match) {
  const g = events.filter((e) => e.player_id === pid && (e.type === 'goal' || e.type === 'penalty_goal')).length
  const parts = []
  if (g) parts.push('⚽'.repeat(Math.min(g, 3)))
  if (events.some((e) => e.player_id === pid && e.type === 'yellow_card')) parts.push('🟨')
  if (events.some((e) => e.player_id === pid && e.type === 'red_card')) parts.push('🟥')
  if (m.motm_player_id === pid) parts.push('⭐')
  return parts.join('') || null
}

function TeamBlock({ team }: { team?: { id: string; name: string; company?: string } & Parameters<typeof TeamLogo>[0]['team'] }) {
  return (
    <Link to={team ? `/equipes/${team.id}` : '#'} className="flex flex-col items-center gap-2 text-center">
      <TeamLogo team={team} size={88} className="sm:size-28" />
      <div className="title-caps text-lg leading-tight sm:text-2xl">{team?.name ?? 'À déterminer'}</div>
      {team?.company && <div className="text-xs text-muted-foreground">{team.company}</div>}
    </Link>
  )
}

function ScorerList({ list, align }: { list: MatchEvent[]; align: 'left' | 'right' }) {
  const L = useLookup()
  return (
    <ul className={cn('space-y-0.5', align === 'right' ? 'text-right' : 'text-left')}>
      {list.map((e) => (
        <li key={e.id} className="text-muted-foreground"><span className="text-white">{playerShort(L.player.get(e.player_id ?? ''))}</span> {e.minute}'{e.type === 'penalty_goal' ? ' (pen.)' : e.type === 'own_goal' ? ' (csc)' : ''}</li>
      ))}
    </ul>
  )
}

function MotmCard({ match, playerId }: { match: Match; playerId: string }) {
  const { league } = useData()
  const L = useLookup()
  const p = L.player.get(playerId), t = L.team.get(p?.team_id ?? '')
  const line = playerMatchLines(league, [match]).get(playerId)?.[0]
  return (
    <Link to={`/joueurs/${playerId}`} className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-award-gold/15 to-transparent p-3">
      <PlayerAvatar player={p} team={t} size={64} />
      <div className="min-w-0">
        <div className="title-caps truncate text-xl">{p?.first_name} {p?.last_name}</div>
        <div className="text-xs text-muted-foreground">{t?.name}</div>
        {line && <div className="mt-1 flex gap-3 text-sm"><span>⚽ {line.goals}</span><span>🅰️ {line.assists}</span><span className="num text-award-gold">{line.rating.toFixed(1)}</span></div>}
      </div>
    </Link>
  )
}

function Timeline({ match, events }: { match: Match; events: MatchEvent[] }) {
  const L = useLookup()
  const items = events.filter((e) => TIMELINE_TYPES.includes(e.type))
  if (!items.length) return <p className="text-sm text-muted-foreground">Aucun événement pour l'instant.</p>
  const icon = (e: MatchEvent) => ({ goal: '⚽', penalty_goal: '⚽', own_goal: '⚽', penalty_missed: '❌', penalty_saved: '🧤', yellow_card: '🟨', red_card: '🟥', substitution: '🔁', goal_disallowed: '🚫' } as Record<string, string>)[e.type] ?? '•'
  let htShown = false
  return (
    <ol className="relative space-y-1">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
      {items.map((e) => {
        const home = e.team_id === match.home_team_id
        const p = L.player.get(e.player_id ?? ''), rel = L.player.get(e.related_player_id ?? '')
        const showHT = !htShown && e.period === '2H'
        if (showHT) htShown = true
        const isGoal = e.type === 'goal' || e.type === 'penalty_goal' || e.type === 'own_goal'
        return (
          <li key={e.id}>
            {showHT && <div className="relative my-3 flex justify-center"><span className="rounded-full bg-night-800 px-3 py-0.5 text-[11px] font-bold uppercase text-muted-foreground ring-1 ring-white/10">Mi-temps {match.home_ht_score ?? ''}{match.home_ht_score != null ? '-' : ''}{match.away_ht_score ?? ''}</span></div>}
            <div className={cn('relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5')}>
              <div className={cn('text-right', !home && 'invisible')}><EventText e={e} p={p} rel={rel} isGoal={isGoal} align="right" /></div>
              <div className={cn('z-10 flex size-10 flex-col items-center justify-center rounded-full bg-night-800 ring-1', isGoal ? 'ring-neon/60 shadow-[0_0_14px_-2px_rgb(34_211_238/.7)]' : 'ring-white/10')}>
                <span className="text-sm leading-none">{icon(e)}</span>
                <span className="num text-[11px] leading-none text-muted-foreground">{e.minute}'</span>
              </div>
              <div className={cn(home && 'invisible')}><EventText e={e} p={p} rel={rel} isGoal={isGoal} align="left" /></div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function EventText({ e, p, rel, isGoal, align }: { e: MatchEvent; p?: ReturnType<ReturnType<typeof useLookup>['player']['get']>; rel?: ReturnType<ReturnType<typeof useLookup>['player']['get']>; isGoal: boolean; align: 'left' | 'right' }) {
  return (
    <div className={cn('text-sm', align === 'right' ? 'text-right' : 'text-left')}>
      <div className={cn('font-semibold', isGoal && 'text-white')}>
        {e.type === 'substitution' ? <span className="inline-flex items-center gap-1"><ArrowRightLeft className="size-3 text-win" />{playerShort(p)}</span> : <PlayerLink player={p} short />}
      </div>
      <div className="text-xs text-muted-foreground">
        {e.type === 'goal' && rel ? <>Passe : <span className="text-orange-300">{playerShort(rel)}</span></> :
          e.type === 'substitution' && rel ? <>remplace {playerShort(rel)}</> :
            e.type === 'goal' ? 'But' : EVENT_LABEL[e.type]}
      </div>
    </div>
  )
}

function MatchStats({ match, events, now }: { match: Match; events: MatchEvent[]; now: number }) {
  const { db } = useData()
  const L = useLookup()
  const rows = db.MatchTeamStats.filter((s) => s.match_id === match.id && (s.period ?? 'full') === 'full')
  const h = rows.find((r) => r.team_id === match.home_team_id), a = rows.find((r) => r.team_id === match.away_team_id)
  const eh = teamStatsFromEvents(match, events, match.home_team_id), ea = teamStatsFromEvents(match, events, match.away_team_id)
  if (match.status === 'scheduled' || match.status === 'postponed') return <EmptyState title="Statistiques disponibles pendant le match" icon={<ShieldAlert />} />
  const poss = h?.possession != null ? { home: h.possession, away: a?.possession ?? 100 - h.possession } : possessionPct(match, now)
  const line = (label: string, hv: number, av: number, pct = false) => ({ label, hv, av, pct })
  const lines = [
    line('Possession', poss.home, poss.away, true),
    line('Tirs', h?.shots ?? eh.shots, a?.shots ?? ea.shots),
    line('Tirs cadrés', h?.shots_on_target ?? eh.shots_on_target, a?.shots_on_target ?? ea.shots_on_target),
    line('Arrêts', h?.saves ?? eh.saves, a?.saves ?? ea.saves),
    line('Corners', h?.corners ?? eh.corners, a?.corners ?? ea.corners),
    line('Fautes', h?.fouls ?? eh.fouls, a?.fouls ?? ea.fouls),
    line('Hors-jeu', h?.offsides ?? eh.offsides, a?.offsides ?? ea.offsides),
    ...(h?.passes != null ? [line('Passes', h.passes, a?.passes ?? 0), line('Passes réussies', h.passes_completed ?? 0, a?.passes_completed ?? 0)] : []),
    line('Cartons jaunes', eh.yellow_cards, ea.yellow_cards),
    line('Cartons rouges', eh.red_cards, ea.red_cards),
  ]
  const hc = L.team.get(match.home_team_id)?.primary_color ?? '#22d3ee', ac = L.team.get(match.away_team_id)?.primary_color ?? '#f472b6'
  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex justify-between text-sm font-bold"><span className="flex items-center gap-2"><TeamLogo team={L.team.get(match.home_team_id)} size={22} />{L.team.get(match.home_team_id)?.short_name}</span><span className="flex items-center gap-2">{L.team.get(match.away_team_id)?.short_name}<TeamLogo team={L.team.get(match.away_team_id)} size={22} /></span></div>
        {lines.map((l) => {
          const total = l.hv + l.av || 1
          return (
            <div key={l.label}>
              <div className="mb-1 flex items-center justify-between text-sm"><span className="num text-lg">{l.hv}{l.pct && '%'}</span><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{l.label}</span><span className="num text-lg">{l.av}{l.pct && '%'}</span></div>
              <div className="flex h-2 gap-1">
                <div className="flex flex-1 justify-end overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${(l.hv / total) * 100}%`, background: hc, boxShadow: `0 0 10px ${hc}` }} /></div>
                <div className="flex-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${(l.av / total) * 100}%`, background: ac, boxShadow: `0 0 10px ${ac}` }} /></div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function PreMatch({ match }: { match: Match }) {
  const { db, league } = useData()
  const L = useLookup()
  const before = db.Match.filter((x) => isPlayed(x) && (x.date ?? '') < (match.date ?? '')).sort(byDate)
  const formOf = (tid: string) => before.filter((x) => x.home_team_id === tid || x.away_team_id === tid).slice(-5)
  const h2h = headToHead(db.Match.filter((x) => x.id !== match.id), match.home_team_id, match.away_team_id)
  const table = competitionStandings(league, match.competition_id)
  const pos = (tid: string) => table.find((r) => r.team_id === tid)
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[match.home_team_id, match.away_team_id].map((tid) => {
        const t = L.team.get(tid), f = formOf(tid), r = pos(tid)
        return (
          <Card key={tid}>
            <CardHeader className="flex-row items-center gap-3"><TeamLogo team={t} size={36} /><div><CardTitle>{t?.name}</CardTitle><div className="text-xs text-muted-foreground">{r ? `${r.rank}e · ${r.points} pts · ${r.gd > 0 ? '+' : ''}${r.gd}` : '—'}</div></div><div className="ml-auto"><FormPills form={f.map((x) => resultFor(x, tid)!)} size="md" /></div></CardHeader>
            <CardContent className="space-y-1.5">
              {f.slice().reverse().map((x) => {
                const opp = L.team.get(x.home_team_id === tid ? x.away_team_id : x.home_team_id)
                const res = resultFor(x, tid)
                return (
                  <Link key={x.id} to={`/matchs/${x.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5">
                    <span className={cn('flex size-6 items-center justify-center rounded-full text-[11px] font-black text-night-950', res === 'W' ? 'bg-win' : res === 'L' ? 'bg-loss' : 'bg-draw')}>{res === 'W' ? 'V' : res === 'L' ? 'D' : 'N'}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(x.date, 'd MMM')}</span>
                    <span className="text-xs">{x.home_team_id === tid ? 'vs' : '@'}</span>
                    <TeamLogo team={opp} size={18} /><span className="flex-1 truncate">{opp?.name}</span>
                    <span className="num">{x.home_score}-{x.away_score}</span>
                  </Link>
                )
              })}
              {!f.length && <p className="text-sm text-muted-foreground">Pas de match récent.</p>}
            </CardContent>
          </Card>
        )
      })}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Confrontations directes</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-3 text-center">
            <div><div className="num text-4xl text-neon">{h2h.aWins}</div><div className="text-xs text-muted-foreground">Victoires {L.team.get(match.home_team_id)?.short_name}</div></div>
            <div><div className="num text-4xl">{h2h.draws}</div><div className="text-xs text-muted-foreground">Nuls</div></div>
            <div><div className="num text-4xl text-neon-pink">{h2h.bWins}</div><div className="text-xs text-muted-foreground">Victoires {L.team.get(match.away_team_id)?.short_name}</div></div>
          </div>
          <div className="space-y-1">
            {h2h.matches.slice().reverse().map((x) => (
              <Link key={x.id} to={`/matchs/${x.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5">
                <span className="w-24 text-xs text-muted-foreground">{fmtDate(x.date, 'd MMM yyyy')}</span>
                <span className="flex-1 truncate text-right">{L.team.get(x.home_team_id)?.name}</span>
                <span className="num rounded bg-white/10 px-2">{x.home_score}-{x.away_score}</span>
                <span className="flex-1 truncate">{L.team.get(x.away_team_id)?.name}</span>
              </Link>
            ))}
            {!h2h.matches.length && <p className="text-sm text-muted-foreground">Première confrontation.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
