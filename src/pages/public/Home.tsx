import { useMemo } from 'react'
import { Billboard, type BillboardSlide } from '@/components/home/Billboard'
import { IPGCard, XPCard } from '@/components/players/Cards'
import { IPG_RANKING } from '@/lib/ipg'
import { SEASON_2025_ID } from '@/api/seed/season2025'
import { playerShort } from '@/lib/format'
import { Link } from 'react-router-dom'
import { CalendarDays, Trophy, Users, Goal, Hand } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useEffectiveSeason, useSeasonCompetitions, useRace, usePlayerXP } from '@/hooks/useStats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchCard } from '@/components/match/MatchCard'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { SectionTitle, StatTile, CompetitionBadge } from '@/components/league/Bits'
import { PlayerAvatar, PlayerLink, TeamLogo } from '@/components/league/Identity'
import { TrophyBadge } from '@/components/awards/TrophyBadge'
import { competitionStandings, generalStandings, kpis, isPlayed, race } from '@/lib/stats'
import { competitionZones } from '@/lib/zones'

export default function Home() {
  const { db, league, settings } = useData()
  const L = useLookup()
  const { scopeSeasonId } = useSeason()
  const season = useEffectiveSeason()
  const comps = useSeasonCompetitions()
  const sid = scopeSeasonId ?? season?.id

  const { lastRound, live, next } = useMemo(() => {
    const ms = db.Match.filter((m) => m.season_id === sid && m.published !== false)
    const live = ms.filter((m) => m.status === 'live')
    const played = ms.filter(isPlayed)
    const lr = Math.max(0, ...played.map((m) => m.round ?? 0))
    const lastRound = played.filter((m) => m.round === lr).sort((a, b) => (a.competition_id + a.date).localeCompare(b.competition_id + b.date))
    const next = ms.filter((m) => m.status === 'scheduled').sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')).slice(0, 4)
    return { lastRound: { round: lr, matches: lastRound }, live, next }
  }, [db.Match, sid])

  // MÊME fonction que la fiche joueur et la page Trophées (computePlayerXP via useRace)
  const podium = useRace({ seasonId: sid }, 'xp').slice(0, 3)
  const xpAll = usePlayerXP({ seasonId: sid })
  const keepers = useMemo(() => race(league, [...xpAll.values()], 'golden_glove', sid).slice(0, 5).map((r) => r.item), [league, xpAll, sid])
  const k = useMemo(() => kpis(league, { seasonId: sid }), [league, sid])
  const teamsInSeason = new Set(comps.flatMap((c) => c.team_ids ?? []))
  const showIPG = sid === SEASON_2025_ID

  const slides = useMemo<BillboardSlide[]>(() => {
    const out: BillboardSlide[] = []
    if (!sid) return out
    const team = (id?: string) => (id ? L.team.get(id) : undefined)
    for (const m of live.slice(0, 2)) {
      const h = team(m.home_team_id), a = team(m.away_team_id)
      out.push({ key: `live-${m.id}`, eyebrow: 'En direct', tone: 'red', title: `${h?.short_name ?? '?'} ${m.home_score ?? 0} – ${m.away_score ?? 0} ${a?.short_name ?? '?'}`, sub: `${h?.name} contre ${a?.name}${m.pitch ? `, ${m.pitch}` : ''}`, href: `/matchs/${m.id}` })
    }
    const lead = generalStandings(league, sid)[0]
    if (lead && lead.played > 0) {
      const t = team(lead.team_id)
      out.push({ key: 'leader', eyebrow: season?.status === 'closed' ? `Champion · ${season.name}` : 'Leader du classement', title: t?.name ?? '', value: lead.points, unit: 'PTS', image: t?.logo_url, sub: `${lead.won} victoires, ${lead.drawn} nuls, ${lead.lost} défaites · différence ${lead.gd > 0 ? '+' : ''}${lead.gd}`, href: `/equipes/${lead.team_id}`, tone: 'orange' })
    }
    const list = [...xpAll.values()]
    const pushPlayer = (key: string, eyebrow: string, r: ReturnType<typeof race>[number] | undefined, value: number, unit: string, tone: BillboardSlide['tone']) => {
      if (!r || !value) return
      const p = L.player.get(r.item.player_id), t = team(r.item.team_id)
      out.push({ key, eyebrow, title: playerShort(p), value, unit, image: t?.logo_url, sub: t?.name, href: p ? `/joueurs/${p.id}` : undefined, tone })
    }
    const sc = race(league, list, 'top_scorer', sid)[0]; pushPlayer('scorer', 'Meilleur buteur', sc, sc?.item.goals ?? 0, 'BUTS', 'orange')
    const as = race(league, list, 'top_assist', sid)[0]; pushPlayer('assist', 'Meilleur passeur', as, as?.item.assists ?? 0, 'PASSES', 'sky')
    const gk = race(league, list, 'golden_glove', sid)[0]; pushPlayer('keeper', 'Gant d’or · meilleur gardien', gk, gk?.item.saves ?? 0, 'ARRÊTS', 'white')
    if (showIPG && IPG_RANKING[0]) {
      const e = IPG_RANKING[0]
      out.push({ key: 'ipg', eyebrow: 'N°1 de l’indice de performance', title: e.name, value: e.ipg.toFixed(0), unit: 'IPG', sub: `${e.team} · ${e.goals} buts, ${e.assists} passes décisives`, href: '/joueurs?vue=ipg', tone: 'sky' })
    }
    if (k.matches) out.push({ key: 'kpi', eyebrow: 'La saison en chiffres', title: `${k.matches} matchs`, value: k.goals, unit: 'BUTS', sub: `${k.goals_avg} buts par match · ${k.assists} passes décisives · ${k.yellow} cartons jaunes`, tone: 'white' })
    return out
  }, [sid, live, league, xpAll, L, season, showIPG, k])

  return (
    <div className="space-y-12">
      <Billboard slides={slides} leagueName={settings.league_name ?? 'Morocco Business League'} seasonLabel={season?.name.replace(/^Saison /, 'saison ') ?? ''} logoUrl={settings.logo_url} />
      <div className="-mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Équipes" value={teamsInSeason.size || db.Team.length} icon={<Users />} color="#8FD0E6" />
        <StatTile label="Matchs joués" value={k.matches} icon={<CalendarDays />} color="#FFFFFF" />
        <StatTile label="Buts" value={k.goals} icon={<Goal />} color="#F85A00" sub={`${k.goals_avg} par match`} />
        <StatTile label="Passes décisives" value={k.assists} icon={<Trophy />} color="#FF8A3D" />
      </div>

      {live.length > 0 && (
        <section>
          <SectionTitle title="En direct" accent="#ef4444" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{live.map((m) => <MatchCard key={m.id} match={m} />)}</div>
        </section>
      )}

      {/* DERNIÈRE JOURNÉE */}
      <section>
        <SectionTitle title={lastRound.round ? `Journée ${lastRound.round}` : 'Dernière journée'} subtitle="Derniers résultats" action={<Button asChild variant="ghost" size="sm"><Link to="/matchs">Tous les matchs →</Link></Button>} />
        {lastRound.matches.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{lastRound.matches.map((m) => <MatchCard key={m.id} match={m} />)}</div>
        ) : <p className="text-muted-foreground">Aucun match joué pour l'instant.</p>}
        {next.length > 0 && (
          <div className="mt-6">
            <h3 className="title-caps mb-3 text-lg text-muted-foreground">À venir</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{next.map((m) => <MatchCard key={m.id} match={m} compact />)}</div>
          </div>
        )}
      </section>

      {/* CLASSEMENTS */}
      <section>
        <SectionTitle title="Classements" action={<Button asChild variant="ghost" size="sm"><Link to="/classement">Classement complet →</Link></Button>} />
        <div className="grid gap-4 lg:grid-cols-2">
          {comps.filter((c) => c.phase === 'gold' || c.phase === 'silver').concat(comps.some((c) => c.phase === 'gold') ? [] : comps.filter((c) => c.phase === 'league_phase')).map((c) => {
            const rows = competitionStandings(league, c.id)
            return (
              <Card key={c.id}>
                <CardHeader className="flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><CompetitionBadge competition={c} className="text-sm" /></CardTitle><span className="text-xs text-muted-foreground">{c.default_pitch ?? c.description}</span></CardHeader>
                <CardContent className="px-1 sm:px-3"><StandingsTable rows={rows} compact zones={competitionZones(c, rows.length)} /></CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* PODIUM XP + GARDIENS */}
      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionTitle title="Les meilleurs joueurs" subtitle={showIPG ? 'Indice de Performance Globale — touchez une carte pour la retourner' : 'Classement XP — touchez une carte pour la retourner'} accent="#facc15" action={<Button asChild variant="ghost" size="sm"><Link to={showIPG ? '/joueurs?vue=ipg' : '/joueurs'}>{showIPG ? 'Top 25 IPG' : 'Classement XP'}</Link></Button>} />
          <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
            {showIPG
              ? [1, 0, 2].map((i) => IPG_RANKING[i] && <IPGCard key={i} e={IPG_RANKING[i]} className={i === 0 ? '' : 'origin-bottom scale-[.93]'} />)
              : [1, 0, 2].map((i) => {
                const r = podium[i]; const p = r && L.player.get(r.item.player_id)
                return p ? <XPCard key={i} r={r} player={p} team={L.team.get(p.team_id)} className={i === 0 ? '' : 'origin-bottom scale-[.93]'} /> : <div key={i} />
              })}
          </div>
        </div>
        <div className="lg:col-span-2">
          <SectionTitle title="Top gardiens" accent="#3b82f6" action={<TrophyBadge category="golden_glove" size={36} />} />
          <Card>
            <CardContent className="divide-y divide-white/5 p-2 sm:p-3">
              {keepers.map((g, i) => {
                const p = L.player.get(g.player_id), t = L.team.get(g.team_id)
                void i
                return (
                  <div key={g.player_id} className="flex items-center gap-3 px-2 py-2.5">
                    <span className="num w-5 text-lg text-muted-foreground">{i + 1}</span>
                    <PlayerAvatar player={p} team={t} size={36} />
                    <div className="min-w-0 flex-1">
                      <PlayerLink player={p} className="block truncate font-semibold" />
                      <div className="text-xs text-muted-foreground">{t?.name}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><div className="num text-lg text-award-blue">{g.clean_sheets}</div><div className="text-[10px] uppercase text-muted-foreground">CS</div></div>
                      <div><div className="num text-lg">{g.saves}</div><div className="text-[10px] uppercase text-muted-foreground"><Hand className="inline size-3" /> Arr.</div></div>
                      <div><div className="num text-lg text-neon">{g.xp}</div><div className="text-[10px] uppercase text-muted-foreground">XP</div></div>
                    </div>
                  </div>
                )
              })}
              {!keepers.length && <p className="p-4 text-sm text-muted-foreground">Pas encore de données.</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* LOGOS */}
      <section>
        <SectionTitle title="Les équipes" action={<Button asChild variant="ghost" size="sm"><Link to="/equipes">Voir toutes →</Link></Button>} />
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-night-950/40 py-6 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-10 [animation-duration:60s]">
            {[0, 1].map((k) => (
              <div key={k} className="flex gap-10" aria-hidden={k === 1}>
                {db.Team.filter((t) => teamsInSeason.has(t.id)).map((t) => (
                  <Link key={t.id} to={`/equipes/${t.id}`} className="flex w-24 flex-col items-center gap-2 opacity-80 transition hover:opacity-100">
                    <TeamLogo team={t} size={64} />
                    <span className="text-center text-xs font-semibold text-muted-foreground">{t.company}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
