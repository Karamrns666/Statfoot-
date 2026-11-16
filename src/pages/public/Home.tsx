import { useMemo, type ReactNode } from 'react'
import { Billboard, type BillboardPoster, type BillboardSlide } from '@/components/home/Billboard'
import { billboardLayout } from '@/lib/billboard'

/** Affiche « Saison 4 » fournie avec le site (WebP en 3 tailles) ; remplaçable dans Admin → Paramètres */
const DEFAULT_POSTER: BillboardPoster = {
  src: '/brand/affiche-saison-4-1280.webp',
  srcSet: '/brand/affiche-saison-4-768.webp 768w, /brand/affiche-saison-4-1280.webp 1280w, /brand/affiche-saison-4-1920.webp 1920w',
  alt: 'Affiche de la Saison 4 de la Morocco Business League : 23 équipes, Atlantique Club, logos des entreprises participantes et joueurs en maillot, organisée par Ardentia',
}
import { SeasonStrip } from '@/components/home/SeasonStrip'
import { NextCaptainBlock } from '@/components/captains/CaptainBits'
import { usePreseason } from '@/hooks/usePreseason'
import { PreseasonTable } from '@/components/preseason/PreseasonTable'
import { displayRanking } from '@/pages/public/Preseason'
import { seasonStrip } from '@/lib/seasonStrip'
import { IPGCard, XPCard } from '@/components/players/Cards'
import { IPG_RANKING } from '@/lib/ipg'
import { SEASON_2025_ID } from '@/api/seed/season2025'
import { initials, playerShort } from '@/lib/format'
import { Link } from 'react-router-dom'
import { RecentBadges } from '@/components/badges/RecentBadges'
import { useRecentUnlocks } from '@/hooks/useBadgeOwnership'
import { Hand } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useSeasonCompetitions, useRace, usePlayerXP, useTeamOfWeek, useTeamStats } from '@/hooks/useStats'
import { TeamOfWeekPitch } from '@/components/teamweek/TeamOfWeekPitch'
import { RewardsList } from '@/components/teamweek/RewardsList'
import { seasonRounds } from '@/lib/rewards'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchCard } from '@/components/match/MatchCard'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { EmptyState, SectionTitle, CompetitionBadge } from '@/components/league/Bits'
import { PlayerAvatar, PlayerLink, TeamLogo } from '@/components/league/Identity'
import { TrophyBadge } from '@/components/awards/TrophyBadge'
import { bestAttack, bestDefense, competitionStandings, kpis, isPlayed, race } from '@/lib/stats'
import { competitionZones } from '@/lib/zones'

export default function Home() {
  const { db, league, settings } = useData()
  const L = useLookup()
  // l'accueil montre TOUJOURS la saison en cours (2026-2027) ; les autres saisons restent dans leurs pages (sélecteur)
  const { seasons } = useSeason()
  const season = seasons.find((x) => x.is_active) ?? seasons[0] ?? null
  const comps = useSeasonCompetitions(season?.id)
  const sid = season?.id
  const preHome = usePreseason(sid)

  const { lastRound, live, next } = useMemo(() => {
    const ms = db.Match.filter((m) => m.season_id === sid && m.published !== false)
    const live = ms.filter((m) => m.status === 'live')
    const played = ms.filter(isPlayed)
    const lr = Math.max(0, ...played.map((m) => m.round ?? 0))
    const lastRound = played.filter((m) => m.round === lr).sort((a, b) => (a.competition_id + a.date).localeCompare(b.competition_id + b.date))
    const next = ms.filter((m) => m.status === 'scheduled').sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')).slice(0, 4)
    return { lastRound: { round: lr, matches: lastRound }, live, next }
  }, [db.Match, sid])

  const k = useMemo(() => kpis(league, { seasonId: sid }), [league, sid])
  const strip = useMemo(() => seasonStrip(league, sid ?? ''), [league, sid, settings.competition_names]) // eslint-disable-line react-hooks/exhaustive-deps
  // l'accueil affiche UNIQUEMENT la saison sélectionnée (aucun repli sur une autre saison)
  const refSid = sid
  const notStarted = k.matches === 0
  const archive = undefined as { name: string } | undefined
  // MÊME fonction que la fiche joueur et la page Trophées (computePlayerXP via useRace)
  const podium = useRace({ seasonId: refSid }, 'xp').slice(0, 3)
  const xpAll = usePlayerXP({ seasonId: refSid })
  const keepers = useMemo(() => race(league, [...xpAll.values()], 'golden_glove', refSid).slice(0, 5).map((r) => r.item), [league, xpAll, refSid])
  const teamsInSeason = useMemo(() => new Set(comps.flatMap((c) => c.team_ids ?? [])), [comps])
  const showIPG = refSid === SEASON_2025_ID
  const tag = archive ? ` · ${archive.name.replace('Saison ', '')}` : ''
  const teamStatsAll = useTeamStats({ seasonId: refSid })
  const lastPlayedRound = useMemo(() => (refSid ? seasonRounds(league, refSid).at(-1) : undefined), [league, refSid])
  const tow = useTeamOfWeek(refSid, lastPlayedRound)
  const hasUnlocks = useRecentUnlocks(sid ?? null, 1).length > 0

  // billboard : 3 panneaux fixes (logo, affiche, saison) puis panneaux de STATISTIQUES de la saison en cours,
  // ajoutés seulement quand la donnée existe (jamais de panneau vide, à 0 ou « – ») ; ordre et activation réglés dans l'admin
  const slides = useMemo<BillboardSlide[]>(() => {
    const out: BillboardSlide[] = []
    if (!sid) return out
    const team = (id?: string) => (id ? L.team.get(id) : undefined)
    const names = comps.map((c) => c.name)
    out.push({ key: 'intro', kind: 'info', eyebrow: season?.name ?? 'Nouvelle saison', title: names.length > 1 ? names.join(' & ') : names[0] ?? 'Coup d’envoi', value: teamsInSeason.size || undefined, unit: teamsInSeason.size ? 'ÉQUIPES' : undefined, sub: `${teamsInSeason.size} entreprises engagées · calendrier, résultats et classements en direct.`, href: '/matchs', tone: 'white' })
    if (notStarted) return out
    const list = [...xpAll.values()]
    const pushPlayer = (key: string, eyebrow: string, r: ReturnType<typeof race>[number] | undefined, value: number, unit: string, tone: BillboardSlide['tone']) => {
      if (!r || !(value > 0)) return
      const p = L.player.get(r.item.player_id), t = team(r.item.team_id)
      if (!p) return
      out.push({ key, kind: 'player', eyebrow, title: playerShort(p), value, unit, image: t?.logo_url, color: t?.primary_color, photo: p.photo_url, initials: initials(p), sub: t?.name, href: `/joueurs/${p.id}`, tone })
    }
    const xp1 = race(league, list, 'xp', sid)[0]; pushPlayer('xp', 'Meilleur joueur · classement XP', xp1, xp1?.item.xp ?? 0, 'XP', 'orange')
    const sc = race(league, list, 'top_scorer', sid)[0]; pushPlayer('scorer', 'Meilleur buteur', sc, sc?.item.goals ?? 0, 'BUTS', 'orange')
    const as = race(league, list, 'top_assist', sid)[0]; pushPlayer('assist', 'Meilleur passeur', as, as?.item.assists ?? 0, 'PASSES', 'sky')
    const gk = race(league, list, 'golden_glove', sid)[0]; pushPlayer('keeper', 'Meilleur gardien', gk, gk?.item.saves ?? 0, 'ARRÊTS', 'white')
    const pushTeam = (key: string, eyebrow: string, id: string | undefined, value: ReactNode, unit: string, sub: string, tone: BillboardSlide['tone']) => {
      const t = team(id); if (!t) return
      out.push({ key, kind: 'team', eyebrow, title: t.name, value, unit, image: t.logo_url, color: t.primary_color, sub, href: `/equipes/${t.id}`, tone })
    }
    const tstats = [...teamStatsAll.values()].filter((t) => t.played > 0)
    const att = bestAttack(tstats)[0]
    if (att && att.gf > 0) pushTeam('attack', 'Meilleure attaque', att.team_id, att.gf, att.gf > 1 ? 'BUTS' : 'BUT', `${att.gf_avg.toLocaleString('fr-FR')} buts par match en ${att.played} match${att.played > 1 ? 's' : ''}`, 'orange')
    const def = bestDefense(tstats)[0]
    if (def) pushTeam('defense', 'Meilleure défense', def.team_id, def.ga > 0 ? def.ga_avg.toLocaleString('fr-FR') : def.played, def.ga > 0 ? 'BC / MATCH' : def.played > 1 ? 'MATCHS SANS ENCAISSER' : 'MATCH SANS ENCAISSER', def.ga > 0 ? `${def.ga} buts encaissés en ${def.played} matchs` : `Aucun but encaissé en ${def.played} match${def.played > 1 ? 's' : ''}`, 'sky')
    const lastMotm = db.Match.filter((m) => m.season_id === sid && m.status === 'finished' && m.motm_player_id).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0]
    if (lastMotm) {
      const p = L.player.get(lastMotm.motm_player_id!), t = team(p?.team_id), h = team(lastMotm.home_team_id), aw = team(lastMotm.away_team_id)
      if (p) out.push({ key: 'motm', kind: 'player', eyebrow: `Homme du dernier match${lastMotm.number ? ` · ${lastMotm.number}` : ''}`, title: playerShort(p), image: t?.logo_url, color: t?.primary_color, photo: p.photo_url, initials: initials(p), sub: `${h?.short_name ?? ''} ${lastMotm.home_score ?? ''} – ${lastMotm.away_score ?? ''} ${aw?.short_name ?? ''}`, href: `/matchs/${lastMotm.id}`, tone: 'orange' })
    }
    return out
  }, [sid, comps, teamsInSeason, league, xpAll, teamStatsAll, L, season, notStarted, db.Match])

  return (
    <div className="space-y-12">
      <Billboard slides={slides} layout={billboardLayout(settings.billboard_slides)} leagueName={settings.league_name ?? 'Morocco Business League'} seasonLabel={season?.name.replace(/^Saison /, 'saison ') ?? ''} logoUrl={settings.logo_url} poster={settings.billboard_poster_hidden ? null : settings.billboard_poster_url ? { src: settings.billboard_poster_url, alt: settings.billboard_poster_alt || DEFAULT_POSTER.alt } : DEFAULT_POSTER} />
      <div className="-mt-6">{sid && <SeasonStrip s={strip} />}</div>

      {live.length > 0 && (
        <section>
          <SectionTitle title="En direct" accent="#ef4444" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{live.map((m) => <MatchCard key={m.id} match={m} />)}</div>
        </section>
      )}

      {/* DERNIÈRE JOURNÉE */}
      <section>
        <SectionTitle title={lastRound.round ? `Journée ${lastRound.round}` : 'Derniers résultats'} subtitle={lastRound.round ? 'Derniers résultats' : season?.name} action={<Button asChild variant="ghost" size="sm"><Link to="/matchs">Tous les matchs →</Link></Button>} />
        {lastRound.matches.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{lastRound.matches.map((m) => <MatchCard key={m.id} match={m} />)}</div>
        ) : <EmptyState title="La saison n’a pas encore commencé">Les résultats s’afficheront ici après la première journée. En attendant, retrouvez la saison 2025-2026 dans <Link to="/historique" className="text-neon underline">l’historique</Link>.</EmptyState>}
        {next.length > 0 && (
          <div className="mt-6">
            <h3 className="title-caps mb-3 text-lg text-muted-foreground">À venir</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{next.map((m) => <MatchCard key={m.id} match={m} compact />)}</div>
          </div>
        )}
      </section>

      {/* MATCH DES CAPITAINES (hors championnat) */}
      <NextCaptainBlock />

      {/* CLASSEMENTS */}
      <section>
        <SectionTitle title="Classements" action={<Button asChild variant="ghost" size="sm"><Link to="/classement">Classement complet →</Link></Button>} />
        <div className="grid gap-4 lg:grid-cols-2">
          {comps.filter((c) => c.phase === 'gold' || c.phase === 'silver').concat(comps.some((c) => c.phase === 'gold') ? [] : comps.filter((c) => c.phase === 'league_phase')).map((c) => {
            const rows = competitionStandings(league, c.id)
            if (preHome && c.id === preHome.comp.id) return (
              <Card key={c.id} className="lg:col-span-2">
                <CardHeader className="flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><CompetitionBadge competition={c} className="text-sm" /></CardTitle><Link to="/pre-saison" className="text-xs font-semibold text-neon hover:underline">Journées et parcours</Link></CardHeader>
                <CardContent className="px-1 sm:px-3"><PreseasonTable rows={displayRanking(preHome)} masterSize={preHome.ps.split?.master_size ?? preHome.cfg.masterSize} final={!!preHome.ps.final_ranking} compact /></CardContent>
              </Card>
            )
            return (
              <Card key={c.id}>
                <CardHeader className="flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><CompetitionBadge competition={c} className="text-sm" /></CardTitle><span className="text-xs text-muted-foreground">{c.default_pitch ?? c.description}</span></CardHeader>
                <CardContent className="px-1 sm:px-3"><StandingsTable rows={rows} compact zones={competitionZones(c, rows.length)} /></CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ÉQUIPE TYPE + RÉCOMPENSES DE LA JOURNÉE */}
      {tow && refSid && (
        <section>
          <SectionTitle title={`Équipe type · Journée ${tow.round}${tag}`} subtitle="Les meilleurs joueurs de la dernière journée" accent="#E8B931" action={<Button asChild variant="ghost" size="sm"><Link to={`/equipe-type${archive ? '' : `?journee=${tow.round}`}`}>Voir l’équipe type</Link></Button>} />
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
            <TeamOfWeekPitch result={tow} size="md" />
            <div className="space-y-3">
              <h3 className="font-display text-xl font-black">Récompenses de la journée {tow.round}</h3>
              <RewardsList seasonId={refSid} period={{ type: 'round', round: tow.round }} compact />
            </div>
          </div>
        </section>
      )}

      {/* PODIUM XP + GARDIENS */}
      {!notStarted && <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionTitle title={`Les meilleurs joueurs${tag}`} subtitle={showIPG ? 'Indice de Performance Globale — touchez une carte pour la retourner' : 'Classement XP — touchez une carte pour la retourner'} accent="#facc15" action={<Button asChild variant="ghost" size="sm"><Link to={showIPG ? '/joueurs?vue=ipg' : '/joueurs'}>{showIPG ? 'Top 25 IPG' : 'Classement XP'}</Link></Button>} />
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
          <SectionTitle title={`Top gardiens${archive ? ` · ${archive.name.replace('Saison ', '')}` : ''}`} accent="#3b82f6" action={<TrophyBadge category="golden_glove" size={36} />} />
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
      </section>}

      {hasUnlocks && (
        <section>
          <SectionTitle title="Derniers badges débloqués" subtitle="Touchez un badge pour télécharger ou partager le visuel" accent="#FF7A1F" action={<Button asChild variant="ghost" size="sm"><Link to="/badges">Tous les badges →</Link></Button>} />
          <RecentBadges seasonId={sid ?? null} />
        </section>
      )}

      {/* LOGOS */}
      <section>
        <SectionTitle title="Les équipes" action={<Button asChild variant="ghost" size="sm"><Link to="/equipes">Voir toutes →</Link></Button>} />
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-night-950/40 py-6 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-10 [animation-duration:60s]">
            {[0, 1].map((k) => (
              <div key={k} className="flex gap-10" aria-hidden={k === 1}>
                {db.Team.filter((t) => teamsInSeason.has(t.id)).map((t) => (
                  <Link key={t.id} to={`/equipes/${t.id}`} tabIndex={k === 1 ? -1 : undefined} className="flex w-24 flex-col items-center gap-2 opacity-80 transition hover:opacity-100">
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
