import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ListOrdered, Radio, Trophy, Users, Goal, Hand } from 'lucide-react'
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
import { competitionStandings, kpis, isPlayed, race } from '@/lib/stats'
import { RankDelta } from '@/components/league/Bits'
import { competitionZones } from '@/lib/zones'
import { cn } from '@/lib/utils'

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
  const podium = useRace({ seasonId: scopeSeasonId }, 'xp').slice(0, 3)
  const xpAll = usePlayerXP({ seasonId: scopeSeasonId })
  const keepers = useMemo(() => race(league, [...xpAll.values()], 'golden_glove', scopeSeasonId).slice(0, 5).map((r) => r.item), [league, xpAll, scopeSeasonId])
  const k = useMemo(() => kpis(league, { seasonId: scopeSeasonId }), [league, scopeSeasonId])
  const teamsInSeason = new Set(comps.flatMap((c) => c.team_ids ?? []))

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 px-5 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_15%_0%,rgba(140,210,255,.25),transparent_60%),radial-gradient(ellipse_50%_70%_at_85%_0%,rgba(140,210,255,.18),transparent_60%),linear-gradient(180deg,#14254a,#0b1426)]" />
        <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full opacity-[.12]" viewBox="0 0 800 160" preserveAspectRatio="none" aria-hidden>
          <g fill="none" stroke="#fff" strokeWidth="2"><rect x="20" y="20" width="760" height="200" /><line x1="400" y1="20" x2="400" y2="200" /><circle cx="400" cy="110" r="60" /><rect x="20" y="60" width="90" height="120" /><rect x="690" y="60" width="90" height="120" /></g>
        </svg>
        <div className="relative max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-neon">{scopeSeasonId ? season?.name : 'Toutes saisons'}</span>
            {live.length > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold uppercase text-red-300"><Radio className="size-3.5" />{live.length} match en direct</span>}
          </div>
          <h1 className="title-caps text-5xl leading-[.9] sm:text-7xl">
            <span className="text-white">{settings.league_name?.split(' ').slice(0, -1).join(' ') || 'StatFoot'}</span>{' '}
            <span className="text-neon neon-text">{settings.league_name?.split(' ').slice(-1)[0]}</span>
          </h1>
          <p className="mt-3 text-lg text-blue-100/80">{settings.tagline}</p>
          <p className="mt-1 text-sm text-muted-foreground">Organisé par <span className="text-white">{settings.organizer}</span></p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/matchs"><CalendarDays />Calendrier</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/classement"><ListOrdered />Classement</Link></Button>
          </div>
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Équipes" value={teamsInSeason.size || db.Team.length} icon={<Users />} />
          <StatTile label="Matchs joués" value={k.matches} icon={<CalendarDays />} color="#a78bfa" />
          <StatTile label="Buts" value={k.goals} icon={<Goal />} color="#ef4444" sub={`${k.goals_avg} / match`} />
          <StatTile label="Passes déc." value={k.assists} icon={<Trophy />} color="#f97316" />
        </div>
      </section>

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
          <SectionTitle title="Podium XP" subtitle="Les joueurs les plus décisifs" accent="#facc15" action={<Button asChild variant="ghost" size="sm"><Link to="/joueurs">Classement XP →</Link></Button>} />
          <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
            {[1, 0, 2].map((i) => {
              const r = podium[i]; if (!r) return <div key={i} />
              const p = L.player.get(r.item.player_id), t = L.team.get(r.item.team_id)
              const colors = ['#facc15', '#cbd5e1', '#d97706']
              const c = colors[i]
              return (
                <Link to={`/joueurs/${p?.id}`} key={i} className={cn('glass group flex flex-col items-center rounded-2xl px-2 pb-4 pt-5 text-center transition hover:-translate-y-1', i === 0 && 'pb-8 pt-8')} style={{ boxShadow: `0 0 40px -18px ${c}` }}>
                  <div className="num mb-2 text-4xl" style={{ color: c, textShadow: `0 0 18px ${c}` }}>{i + 1}</div>
                  <PlayerAvatar player={p} team={t} size={i === 0 ? 84 : 64} />
                  <div className="mt-3 w-full truncate font-display text-base font-bold uppercase sm:text-lg">{p?.first_name.charAt(0)}. {p?.last_name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><TeamLogo team={t} size={14} /><span className="truncate">{t?.short_name}</span></div>
                  <div className="num mt-2 text-2xl sm:text-3xl" style={{ color: c }}>{r.item.xp}<span className="ml-1 text-sm text-muted-foreground">XP</span></div>
                  <RankDelta delta={r.delta} />
                </Link>
              )
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
                {db.Team.map((t) => (
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
