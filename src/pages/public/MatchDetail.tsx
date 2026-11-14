import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, MapPin, Star, Vote, ArrowRightLeft, Share2, ShieldAlert, User, Hand, Image as ImageIcon, Play } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useNow } from '@/hooks/useNow'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RANK_PENDING, rankLabel, useCompetitionRanking } from '@/hooks/useRanking'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CompetitionBadge, EmptyState, FormPills } from '@/components/league/Bits'
import { PlayerAvatar, PlayerLink, TeamLogo } from '@/components/league/Identity'
import { LineupList } from '@/components/match/LineupList'
import { SuspendedAbsents } from '@/components/reglement/SuspendedAbsents'
import { ArtLink } from '@/components/reglement/ArtLink'
import { REGLEMENT } from '@/lib/reglement'
import { MotmVoteWidget } from '@/components/match/MotmVoteWidget'
import { ShareVisualsDialog } from '@/components/share/ShareVisualsDialog'
import { ShareMatchButton } from '@/components/visuals/ShareMatchVisuals'
import { LiveBadge } from '@/components/match/LiveBadge'
import { TeamStatsBars } from '@/components/match/TeamStatsBars'
import { fmtDate, playerShort, STATUS_LABEL } from '@/lib/format'
import { fmtDay, fmtHour } from '@/lib/matchTime'
import { STAGE_LABELS } from '@/lib/schedule'
import { byDate, headToHead, isPlayed, matchScorers, resultFor, computePlayerXP } from '@/lib/stats'
import { fmtMinute, fmtScore, keeperMatchStats, possession, timelineByPeriod, PERIOD_LABEL } from '@/lib/matchEngine'
import type { Match, MatchEvent, Player } from '@/types/entities'
import { cn } from '@/lib/utils'
import { AddToCalendar } from '@/components/match/AddToCalendar'
import { countdown } from '@/lib/ics'

export default function MatchDetail() {
  const { id } = useParams()
  const { db } = useData()
  const L = useLookup()
  const now = useNow(1000)
  const [share, setShare] = useState(false)
  const m = db.Match.find((x) => x.id === id)
  const events = useMemo(() => db.MatchEvent.filter((e) => e.match_id === id), [db.MatchEvent, id])
  if (!m) return <EmptyState title="Match introuvable"><Link to="/matchs" className="text-neon">Retour aux matchs</Link></EmptyState>
  const home = L.team.get(m.home_team_id), away = L.team.get(m.away_team_id)
  const comp = L.competition.get(m.competition_id)
  const ls = L.live.get(m.id)
  const scorers = matchScorers(m, events)
  const live = m.status === 'live'
  const showScore = live || m.status === 'finished'
  const lineups = { home: db.Lineup.find((l) => l.match_id === m.id && l.team_id === m.home_team_id), away: db.Lineup.find((l) => l.match_id === m.id && l.team_id === m.away_team_id) }
  const pos = ls ? possession(ls, now) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm"><Link to="/matchs"><ArrowLeft />Matchs</Link></Button>
        <div className="flex gap-2">
          {m.status === 'scheduled' && <AddToCalendar matches={[m]} filename={`mbl-${home?.short_name ?? ''}-${away?.short_name ?? ''}.ics`.toLowerCase()} />}
          {m.status === 'finished' && showScore ? <ShareMatchButton match={m} /> : showScore && <Button variant="outline" size="sm" onClick={() => setShare(true)}><Share2 />Visuels Instagram</Button>}
        </div>
      </div>
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 50% 90% at 0% 50%, ${home?.primary_color}33, transparent 70%), radial-gradient(ellipse 50% 90% at 100% 50%, ${away?.primary_color}33, transparent 70%), linear-gradient(180deg,#0D2B66,#04163D)` }} />
        <div className="relative">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-sm">
            <CompetitionBadge competition={comp} />
            <span className="text-muted-foreground">{m.stage && !['league_phase', 'cup'].includes(m.stage) ? STAGE_LABELS[m.stage] : `Journée ${m.round}`}</span>
            {live ? <span className="inline-flex items-center gap-2"><span className="rounded bg-red-500 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-white">En direct</span><LiveBadge match={m} /></span>
              : <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold uppercase', m.status === 'finished' ? 'bg-white/10' : m.status === 'postponed' || m.status === 'cancelled' ? 'bg-amber-400/15 text-amber-300' : 'bg-neon/10 text-neon')}>{STATUS_LABEL[m.status]}</span>}
          </div>
          {m.postponed_from && <p className="-mt-2 mb-4 text-center text-xs font-semibold text-amber-300">Match reporté — initialement prévu le {fmtDay(m.postponed_from)} à {fmtHour(m.postponed_from)}{m.postponed_reason ? ` (${m.postponed_reason})` : ''}</p>}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-8">
            <TeamBlock id={m.home_team_id} />
            <div className="flex flex-col items-center pt-2">
              {showScore
                ? <div className={cn('num flex items-center gap-2 text-6xl sm:text-8xl', live && 'text-white')}><span>{m.home_score ?? 0}</span><span className="text-4xl text-white/30">-</span><span>{m.away_score ?? 0}</span></div>
                : m.date ? <div className="num text-4xl text-neon sm:text-6xl">{fmtHour(m.date)}</div> : <div className="text-center text-sm font-bold text-amber-200">Horaire à définir</div>}
              {m.status === 'scheduled' && <div className="hidden sm:block"><Countdown to={m.date} now={now} /></div>}
              {m.penalties && <div className="mt-1 rounded bg-white/10 px-2 text-xs font-semibold">{fmtScore(m)}</div>}
              {m.home_ht_score != null && showScore && <div className="mt-1 text-xs text-muted-foreground">MT {m.home_ht_score}-{m.away_ht_score}</div>}
              {m.extra_time && <div className="mt-1 text-[11px] text-muted-foreground">après prolongation</div>}
            </div>
            <TeamBlock id={m.away_team_id} />
          </div>
          {/* téléphone : compte à rebours sous les deux équipes (les deux restent visibles) */}
          {m.status === 'scheduled' && <div className="mt-3 flex justify-center sm:hidden"><Countdown to={m.date} now={now} /></div>}
          {showScore && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <ScorerList list={scorers.home} align="right" />
              <ScorerList list={scorers.away} align="left" />
            </div>
          )}
          {pos && (live || m.status === 'finished') && (pos.home_ms + pos.away_ms) > 0 && (
            <div className="mx-auto mt-5 max-w-md">
              <div className="mb-1 flex justify-between text-xs"><span className="num text-base">{pos.home_pct}%</span><span className="uppercase tracking-wider text-muted-foreground">Possession</span><span className="num text-base">{pos.away_pct}%</span></div>
              <div className="flex h-2 overflow-hidden rounded-full bg-white/10"><div style={{ width: `${pos.home_pct}%`, background: home?.primary_color }} /><div style={{ width: `${pos.away_pct}%`, background: away?.primary_color }} /></div>
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-white/10 pt-4 text-xs text-muted-foreground sm:text-sm">
            {m.number && <span className="font-bold">{m.number}</span>}
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{m.date ? `${fmtDay(m.date)} · ${fmtHour(m.date)}` : 'Horaire à définir'}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{m.pitch ?? '—'}</span>
            {m.referee && <span className="inline-flex items-center gap-1.5"><User className="size-4" />{m.referee}</span>}
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
                <CardContent>{m.motm_player_id ? <MotmCard match={m} playerId={m.motm_player_id} /> : <p className="text-sm text-muted-foreground">{showScore ? 'Désigné à la fin du match.' : 'Désigné après le match.'}</p>}</CardContent>
              </Card>
              {m.status === 'finished' && <KeepersCard match={m} events={events} />}
              {showScore && <CardsCard events={events} />}
              {(m.motm_vote_closes_at || live) && m.status !== 'scheduled' && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Vote className="size-5 text-neon" />Vote du public</CardTitle></CardHeader><CardContent><MotmVoteWidget match={m} /></CardContent></Card>}
            </div>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Déroulé du match</CardTitle></CardHeader>
              <CardContent><Timeline match={m} events={events} /></CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="stats"><StatsTab match={m} events={events} now={now} /></TabsContent>
        <TabsContent value="lineups">
          <div className="grid gap-4 md:grid-cols-2">
            <div><LineupList lineup={lineups.home} team={home} events={events} /><SuspendedAbsents match={m} teamId={m.home_team_id} /></div>
            <div><LineupList lineup={lineups.away} team={away} events={events} /><SuspendedAbsents match={m} teamId={m.away_team_id} /></div>
          </div>
        </TabsContent>
        <TabsContent value="preview"><div className="mb-3 grid gap-2 md:grid-cols-2"><SuspendedAbsents match={m} teamId={m.home_team_id} /><SuspendedAbsents match={m} teamId={m.away_team_id} /></div><PreMatch match={m} /></TabsContent>
      </Tabs>
      <MatchGallery match={m} />
      {share && <ShareVisualsDialog open={share} onOpenChange={setShare} match={m} />}
    </div>
  )
}

function TeamBlock({ id }: { id: string }) {
  const team = useLookup().team.get(id)
  return (
    <Link to={`/equipes/${id}`} className="flex min-w-0 flex-col items-center gap-2 text-center">
      <TeamLogo team={team} size={72} className="sm:scale-[1.22] sm:my-2" />
      <div className="title-caps w-full text-base leading-tight [overflow-wrap:anywhere] [hyphens:auto] sm:text-2xl">{team?.name ?? 'À déterminer'}</div>
      {team?.company && <div className="text-xs text-muted-foreground">{team.company}</div>}
    </Link>
  )
}

function ScorerList({ list, align }: { list: MatchEvent[]; align: 'left' | 'right' }) {
  const L = useLookup()
  return (
    <ul className={cn('space-y-0.5', align === 'right' ? 'text-right' : 'text-left')}>
      {list.map((e) => <li key={e.id} className="text-muted-foreground"><span className="text-white">⚽ {e.player_id ? playerShort(L.player.get(e.player_id)) : e.player_name_free ?? (e.type === 'own_goal' ? 'Contre son camp' : '—')}</span> {fmtMinute(e.minute, e.added_minute)}{e.goal_kind === 'penalty' ? ' (pen.)' : e.type === 'own_goal' ? ' (csc)' : ''}{e.type === 'goal' && e.related_player_id ? <span className="text-neon-soft"> · passe {playerShort(L.player.get(e.related_player_id))}</span> : null}</li>)}
    </ul>
  )
}

function MotmCard({ match, playerId }: { match: Match; playerId: string }) {
  const { league } = useData()
  const L = useLookup()
  const p = L.player.get(playerId), t = L.team.get(p?.team_id ?? '')
  const x = useMemo(() => computePlayerXP({ ...league, matches: [match], suspensions: [], monthlyAwards: [] }, { seasonId: match.season_id }).get(playerId), [league, match, playerId])
  return (
    <Link to={`/joueurs/${playerId}`} className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-award-gold/15 to-transparent p-3">
      <PlayerAvatar player={p} team={t} size={64} />
      <div className="min-w-0">
        <div className="title-caps truncate text-xl">{p?.first_name} {p?.last_name}</div>
        <div className="text-xs text-muted-foreground">{t?.name}</div>
        {x && <div className="mt-1 flex gap-3 text-sm"><span>⚽ {x.goals}</span><span>🅰 {x.assists}</span><span className="num text-neon">{x.xp > 0 ? '+' : ''}{x.xp} XP</span></div>}
      </div>
    </Link>
  )
}

const ICON: Record<string, string> = { goal: '⚽', own_goal: '⚽', penalty_missed: '❌', penalty_saved: '🧤', yellow_card: '🟨', second_yellow: '🟨🟥', red_card: '🟥', substitution: '🔁', goal_disallowed: '🚫', gk_change: '🧤' }

export function Timeline({ match, events }: { match: Match; events: MatchEvent[] }) {
  const L = useLookup()
  const byP = timelineByPeriod(events)
  if (!byP.size) return <p className="text-sm text-muted-foreground">Aucun événement pour l'instant.</p>
  return (
    <div className="space-y-4">
      {[...byP.entries()].map(([p, list]) => (
        <div key={p}>
          <div className="mb-2 flex justify-center"><span className="rounded-full bg-night-800 px-3 py-0.5 text-[11px] font-bold uppercase text-muted-foreground ring-1 ring-white/10">{PERIOD_LABEL[p]}</span></div>
          <ol className="relative space-y-1">
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
            {list.map((e) => {
              const home = e.team_id === match.home_team_id
              const isGoal = e.type === 'goal' || e.type === 'own_goal'
              const side = <EventText e={e} p={L.player.get(e.player_id ?? '')} rel={L.player.get(e.related_player_id ?? '')} align={home ? 'right' : 'left'} />
              return (
                <li key={e.id} className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1">
                  <div className={cn(!home && 'invisible')}>{home && side}</div>
                  <div className={cn('z-10 flex size-11 flex-col items-center justify-center rounded-full bg-night-800 ring-1', isGoal ? 'ring-neon/70 shadow-[0_0_14px_-2px_rgb(242_107_29/.7)]' : 'ring-white/10')}>
                    <span className="text-sm leading-none">{ICON[e.type] ?? '•'}</span>
                    <span className="num text-[10px] leading-none text-muted-foreground">{fmtMinute(e.minute, e.added_minute)}</span>
                  </div>
                  <div className={cn(home && 'invisible')}>{!home && side}</div>
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </div>
  )
}

function EventText({ e, p, rel, align }: { e: MatchEvent; p?: Player; rel?: Player; align: 'left' | 'right' }) {
  const label: Record<string, string> = { goal: e.goal_kind === 'penalty' ? 'But sur penalty' : e.goal_kind === 'header' ? 'But de la tête' : e.goal_kind === 'direct_free_kick' ? 'Coup franc direct' : 'But', own_goal: 'But contre son camp', penalty_missed: 'Penalty manqué', penalty_saved: 'Penalty arrêté', yellow_card: 'Carton jaune', second_yellow: '2e avertissement → rouge', red_card: 'Carton rouge', goal_disallowed: 'But refusé', gk_change: 'Changement de gardien' }
  return (
    <div className={cn('text-sm', align === 'right' ? 'text-right' : 'text-left')}>
      <div className="font-semibold">
        {e.type === 'substitution' ? <span className="inline-flex items-center gap-1"><ArrowRightLeft className="size-3 text-win" />{playerShort(p)}</span> : p ? <PlayerLink player={p} short /> : <span>{e.player_name_free ?? 'Joueur inconnu'}</span>}
      </div>
      <div className="text-xs text-muted-foreground">
        {e.type === 'goal' && rel ? <>{label.goal} · passe <span className="text-neon-soft">{playerShort(rel)}</span></> : e.type === 'substitution' ? <>remplace {playerShort(rel)}</> : label[e.type] ?? e.type}
      </div>
    </div>
  )
}

function StatsTab({ match, events, now }: { match: Match; events: MatchEvent[]; now: number }) {
  const { db } = useData()
  const L = useLookup()
  if (match.status === 'scheduled' || match.status === 'postponed') return <EmptyState title="Statistiques disponibles pendant le match" icon={<ShieldAlert />} />
  const manual = db.MatchTeamStats.filter((s) => s.match_id === match.id && (s.period ?? 'full') === 'full')
  return <TeamStatsBars match={match} events={events} live={L.live.get(match.id)} now={now} manual={match.source === 'match_center' ? undefined : manual} />
}

function PreMatch({ match }: { match: Match }) {
  const { db } = useData()
  const L = useLookup()
  // forme récente : matchs de la même saison uniquement
  const before = db.Match.filter((x) => x.season_id === match.season_id && isPlayed(x) && (x.date ?? '') < (match.date ?? '')).sort(byDate)
  const formOf = (tid: string) => before.filter((x) => x.home_team_id === tid || x.away_team_id === tid).slice(-5)
  const h2h = headToHead(db.Match.filter((x) => x.id !== match.id), match.home_team_id, match.away_team_id)
  // même classement que la page Classement (pré-saison : classement suisse)
  const ranking = useCompetitionRanking(match.competition_id)
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[match.home_team_id, match.away_team_id].map((tid) => {
        const t = L.team.get(tid), f = formOf(tid), r = ranking.byTeam.get(tid)
        return (
          <Card key={tid}>
            <CardHeader className="flex-row items-center gap-3"><TeamLogo team={t} size={36} /><div><CardTitle>{t?.name}</CardTitle><div className="text-xs text-muted-foreground">{ranking.started ? rankLabel(r, true) : <>Rang – · <span className="text-white/60">{RANK_PENDING}</span></>}</div></div><div className="ml-auto"><FormPills form={f.map((x) => resultFor(x, tid)!)} size="md" /></div></CardHeader>
            <CardContent className="space-y-1">
              {f.slice().reverse().map((x) => {
                const opp = L.team.get(x.home_team_id === tid ? x.away_team_id : x.home_team_id), res = resultFor(x, tid)
                return (
                  <Link key={x.id} to={`/matchs/${x.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5">
                    <span className={cn('flex size-6 items-center justify-center rounded-full text-[11px] font-black text-night-950', res === 'W' ? 'bg-win' : res === 'L' ? 'bg-loss' : 'bg-draw')}>{res === 'W' ? 'V' : res === 'L' ? 'D' : 'N'}</span>
                    <span className="w-14 text-xs text-muted-foreground">{fmtDate(x.date, 'd MMM')}</span>
                    <TeamLogo team={opp} size={18} /><span className="flex-1 truncate">{opp?.name}</span><span className="num">{x.home_score}-{x.away_score}</span>
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
            <div><div className="num text-4xl text-sky-400">{h2h.bWins}</div><div className="text-xs text-muted-foreground">Victoires {L.team.get(match.away_team_id)?.short_name}</div></div>
          </div>
          {h2h.matches.slice().reverse().map((x) => (
            <Link key={x.id} to={`/matchs/${x.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5">
              <span className="w-24 text-xs text-muted-foreground">{fmtDate(x.date, 'd MMM yyyy')}</span>
              <span className="flex-1 truncate text-right">{L.team.get(x.home_team_id)?.name}</span><span className="num rounded bg-white/10 px-2">{x.home_score}-{x.away_score}</span><span className="flex-1 truncate">{L.team.get(x.away_team_id)?.name}</span>
            </Link>
          ))}
          {!h2h.matches.length && <p className="text-sm text-muted-foreground">Première confrontation.</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function Countdown({ to, now }: { to?: string; now: number }) {
  const c = countdown(to, now)
  if (!c) return null
  const parts = c.d ? [[c.d, 'j'], [c.h, 'h'], [c.m, 'min']] : [[c.h, 'h'], [c.m, 'min'], [c.s, 's']]
  return (
    <div className="mt-2 flex items-baseline gap-2 rounded-xl bg-black/25 px-3 py-1.5" aria-label="Compte à rebours avant le coup d'envoi">
      <span className="text-[11px] text-muted-foreground">Coup d’envoi dans</span>
      {parts.map(([v, u]) => <span key={u as string} className="num text-xl">{String(v).padStart(2, '0')}<span className="ml-0.5 text-xs text-muted-foreground">{u}</span></span>)}
    </div>
  )
}

function KeepersCard({ match, events }: { match: Match; events: MatchEvent[] }) {
  const { db } = useData()
  const L = useLookup()
  const rows = [match.home_team_id, match.away_team_id].flatMap((tid) => keeperMatchStats(match, db.Lineup.find((l) => l.match_id === match.id && l.team_id === tid), events, tid).map((k) => ({ ...k, team_id: tid })))
  if (!rows.length) return null
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Hand className="size-5 text-sky" />Gardiens</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {rows.map((k) => {
          const p = L.player.get(k.player_id), t = L.team.get(k.team_id)
          return (
            <Link key={k.player_id} to={`/joueurs/${k.player_id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5">
              <TeamLogo team={t} size={22} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{playerShort(p)}</span>
              <span className="text-center"><span className="num text-lg">{k.saves}</span><span className="block text-[10px] text-muted-foreground">arrêts</span></span>
              <span className="text-center"><span className="num text-lg">{k.conceded}</span><span className="block text-[10px] text-muted-foreground">encaissés</span></span>
              {k.clean_sheet && <span className="rounded bg-win/15 px-1.5 text-[11px] font-bold text-win">Clean sheet</span>}
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

function CardsCard({ events }: { events: MatchEvent[] }) {
  const L = useLookup()
  const cards = events.filter((e) => e.type === 'yellow_card' || e.type === 'second_yellow' || e.type === 'red_card')
  if (!cards.length) return null
  return (
    <Card>
      <CardHeader><CardTitle className="flex flex-wrap items-center gap-2">Cartons<span className="ml-auto flex gap-2"><ArtLink art={REGLEMENT.cards.artYellow} /><ArtLink art={REGLEMENT.cards.artRed} /></span></CardTitle></CardHeader>
      <CardContent className="space-y-1 text-sm">
        {cards.map((e) => (
          <div key={e.id} className="flex items-center gap-2">
            <span className={cn('inline-block h-4 w-3 rounded-sm', e.type === 'yellow_card' ? 'bg-yellow-400' : 'bg-red-500')} aria-label={e.type === 'yellow_card' ? 'Carton jaune' : 'Carton rouge'} />
            <TeamLogo team={L.team.get(e.team_id)} size={16} />
            <span className="flex-1">{e.card_target === 'official' ? `${e.player_name_free ?? 'Officiel'} (officiel)` : playerShort(L.player.get(e.player_id ?? '')) || e.player_name_free}{e.card_target === 'substitute' ? <span className="text-xs text-muted-foreground"> (banc)</span> : null}{e.type === 'second_yellow' ? <span className="text-xs text-red-300"> 2e avertissement</span> : null}</span>
            <span className="text-xs text-muted-foreground">{fmtMinute(e.minute, e.added_minute)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function MatchGallery({ match }: { match: Match }) {
  const { db } = useData()
  const items = db.Media.filter((x) => x.published !== false && x.match_id === match.id)
  if (!items.length) return null
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-2xl font-black"><ImageIcon className="size-5 text-neon" />Galerie du match</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((x) => (
          <a key={x.id} href={x.url} target="_blank" rel="noreferrer" className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-night-950">
            <img src={x.thumbnail_url ?? x.url} alt={x.title} loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
            {x.type === 'video' && <Play className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 fill-white text-white drop-shadow" />}
          </a>
        ))}
      </div>
    </section>
  )
}
