import { useRookie } from '@/hooks/useSeniority'
import { useMemo, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PlayerDisciplineCard, SuspendedBadge, useIsSuspended } from '@/components/reglement/PlayerDisciplineCard'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Check, Circle, Flame, Medal, Swords, Target, Trophy } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useEffectiveSeason, useRace } from '@/hooks/useStats'
import { EmptyState, RankDelta, RookieBadge, SectionTitle } from '@/components/league/Bits'
import { PlayerAvatar, RoleBadge, TeamLogo } from '@/components/league/Identity'
import { XPCard } from '@/components/players/Cards'
import { SeniorityBadge } from '@/components/league/SeniorityBadge'
import { CardShareActions } from '@/components/players/CardShare'
import { BadgeMedal } from '@/components/players/BadgeMedal'
import { BadgeCollection } from '@/components/badges/BadgeCollection'
import { RARITY_LABEL, badgeMeta } from '@/lib/badgeCatalog'
import { SortableTable } from '@/components/league/SortableTable'
import { shotColumns } from '@/components/league/shotColumns'
import { fmtAccuracy, fmtShots, fmtShotsPerGoal } from '@/lib/shots'
import { AXIS, ChartBox, GRID, Legend, SERIES, TOOLTIP } from '@/components/charts/theme'
import { AWARD_LABELS, computePlayerXP, isPlayed, ageAt, type XPLine } from '@/lib/stats'
import { BADGES, RATING_RULES, challengeResult, challengeTargets, decisiveStreak, nextBadges, playerBadges, playerMatchLog } from '@/lib/badges'
import { fmtDate, ordinal, playerName, playerShort } from '@/lib/format'
import { cn } from '@/lib/utils'

const slugName = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const monthLabel = (m: string) => format(new Date(`${m}-01T12:00:00`), 'MMMM yyyy', { locale: fr })
const pts = (n: number) => `${n > 0 ? '+' : ''}${n}`

export default function PlayerDetail() {
  const rookie = useRookie()
  const { id } = useParams()
  const { db, league, settings } = useData()
  const L = useLookup()
  const { scopeSeasonId, seasons, allSeasons, hasHidden } = useSeason()
  const eff = useEffectiveSeason()
  const sid = scopeSeasonId ?? eff?.id ?? null
  const season = sid ? L.season.get(sid) : undefined
  const raw = L.player.get(id ?? '')
  // joueur uniquement présent dans des saisons masquées : introuvable sur le site public
  const p = raw && (!hasHidden || !raw.season_ids?.length || raw.season_ids.some((x) => seasons.some((s) => s.id === x))) ? raw : undefined
  // même fonction que Trophées et l'accueil : raceWithEvolution → computePlayerXP
  const ranking = useRace({ seasonId: sid }, 'xp')
  const scorers = useRace({ seasonId: sid }, 'top_scorer')
  const meIdx = ranking.findIndex((r) => r.item.player_id === id)
  // joueur inscrit sans stats (aucun match joué) : carte quand même affichée, avec des stats à zéro
  const zero = useMemo(() => (meIdx < 0 && id ? computePlayerXP(league, { seasonId: sid ?? undefined }).get(id) : undefined), [meIdx, id, league, sid])
  const me = meIdx >= 0 ? ranking[meIdx] : undefined
  const cardRow = me ?? (zero ? { item: zero, rank: 0, previousRank: null, delta: null } : undefined)
  // historique : y compris les saisons masquées et les fiches des saisons précédentes du même joueur
  // (même personne, ou même nom dans la même entreprise — chaque saison a sa propre fiche joueur)
  const history = useMemo(() => {
    if (!p) return []
    const key = (x: { first_name: string; last_name: string }) => `${x.first_name} ${x.last_name}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
    const club = L.team.get(p.team_id)?.short_name
    const same = db.Player.filter((x) => x.id === p.id || (p.person_id && x.person_id === p.person_id) || (key(x) === key(p) && !!club && L.team.get(x.team_id)?.short_name === club))
    return allSeasons.flatMap((s) => {
      const rec = same.find((x) => x.id === p.id && x.season_ids?.includes(s.id)) ?? same.find((x) => x.season_ids?.includes(s.id))
      return rec ? [{ season: s, x: computePlayerXP(league, { seasonId: s.id }).get(rec.id) }] : []
    })
  }, [allSeasons, league, db.Player, L.team, p])
  const log = useMemo(() => (id ? playerMatchLog(league, id, sid) : []), [league, id, sid])
  const suspendedLeft = useIsSuspended(id, sid)
  // homme du match : total de carrière (toutes saisons)
  const motmCount = useMemo(() => league.matches.filter((m) => m.motm_player_id === id && isPlayed(m)).length, [league.matches, id])
  if (!p) return <EmptyState title="Joueur introuvable" />

  const t = L.team.get(p.team_id)
  const s = me?.item
  const keeper = p.position === 'GK' || (s?.gk_matches ?? 0) > 0
  const badges = playerBadges(log, { keeper })
  const unlocked = badges.filter((b) => b.unlocked).length
  const next = nextBadges(badges)
  const streak = decisiveStreak(log)
  const scorerRank = scorers.find((r) => r.item.player_id === id)
  const ratingByMatch = new Map(log.map((l) => [l.match.id, l.rating]))
  const best = log.reduce((a, l) => Math.max(a, l.rating), 0)

  // défis : résultat de la dernière journée + objectifs de la suivante (saison en cours)
  const last = log.length ? challengeResult(log, log.length - 1) : null
  const nextRound = (log.at(-1)?.round ?? 0) + 1
  const upcoming = season?.status !== 'closed' && log.length ? challengeTargets(log, keeper) : null

  // rivalité : joueur juste devant / juste derrière au classement XP
  const above = meIdx > 0 ? ranking[meIdx - 1] : undefined
  const below = meIdx >= 0 ? ranking[meIdx + 1] : undefined

  // titres
  const titles = [
    ...db.MonthlyAward.filter((a) => a.season_id === sid && ((a.type === 'player' && a.player_id === p.id) || (a.type === 'team' && a.team_id === p.team_id && log.some((l) => l.match.date?.startsWith(a.month))) || (a.type === 'goal' && db.MatchEvent.find((e) => e.id === a.event_id)?.player_id === p.id)))
      .map((a) => ({ key: a.id, label: `${a.type === 'player' ? 'Joueur du mois' : a.type === 'team' ? 'Équipe du mois' : 'But du mois'} · ${monthLabel(a.month)}` })),
    ...db.Award.filter((a) => a.season_id === sid && a.player_id === p.id && a.status === 'published' && !a.not_awarded)
      .map((a) => ({ key: a.id, label: `${AWARD_LABELS[a.category]} · ${L.season.get(a.season_id)?.name ?? ''}` })),
  ]

  const chart = (s?.byMatch ?? []).map((b) => { const m = db.Match.find((x) => x.id === b.match_id)!; return { label: `J${m.round}`, xp: b.xp, match: m } }).sort((a, b) => (a.match.date ?? '').localeCompare(b.match.date ?? ''))
  const linesByMatch = new Map<string, XPLine[]>()
  const offMatch: XPLine[] = []
  for (const l of s?.lines ?? []) { if (!l.match_id) { offMatch.push(l); continue } if (!linesByMatch.has(l.match_id)) linesByMatch.set(l.match_id, []); linesByMatch.get(l.match_id)!.push(l) }
  const xpRows = [...linesByMatch.entries()].map(([mid, lines]) => {
    const m = db.Match.find((x) => x.id === mid)!
    const mine = log.find((x) => x.match.id === mid)
    const sum = (keys: XPLine['key'][]) => lines.filter((l) => keys.includes(l.key)).reduce((a, l) => a + l.points, 0)
    const mult = lines.find((l) => l.key === 'goal' || l.key === 'assist')?.mult
    return {
      m, opp: mine ? L.team.get(mine.opponent_id) : undefined, oppRank: mine?.opponent_rank,
      goals: lines.find((l) => l.key === 'goal')?.count ?? 0, assists: lines.find((l) => l.key === 'assist')?.count ?? 0, mult,
      result: sum(['win', 'loss']), sanctions: sum(['yellow', 'double_yellow_total', 'red_direct', 'per_suspension_match']),
      keeper: sum(['clean_sheet_gk', 'save', 'penalty_saved', 'shootout_saved', 'goal_conceded_gk']),
      total: lines.reduce((a, l) => a + l.points, 0), rating: ratingByMatch.get(mid),
    }
  }).sort((a, b) => (a.m.date ?? '').localeCompare(b.m.date ?? ''))

  return (
    <div className="space-y-8">
      {/* EN-TÊTE */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8" style={{ background: `radial-gradient(ellipse 60% 100% at 100% 0%, ${t?.primary_color}40, transparent 70%), linear-gradient(180deg,#0D2B66,#04163D)` }}>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          {cardRow ? (
            <div className="flex w-56 shrink-0 flex-col items-center gap-3">
              <XPCard r={cardRow} player={p} team={t} className="w-56" />
              <CardShareActions card={<XPCard r={cardRow} player={p} team={t} faceOnly />} fileName={`carte-${slugName(`${p.first_name}-${p.last_name}`)}.png`}
                url={`${location.origin}/joueurs/${p.id}`} text={`Ma carte ${p.first_name} ${p.last_name} · Morocco Business League`} subtitle={[t?.name, season?.name].filter(Boolean).join(' · ')} />
            </div>
          ) : <PlayerAvatar player={p} team={t} size={132} />}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <RoleBadge long position={p.position} captain={p.is_captain || t?.captain_player_id === p.id} />{rookie(p) && <RookieBadge />}<SuspendedBadge remaining={suspendedLeft} />{motmCount > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-neon/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-neon" title="Nombre de fois homme du match (toutes saisons)"><Trophy className="size-3" aria-hidden />Homme du match ×{motmCount}</span>}
              <SeniorityBadge teamId={t?.id} showSeasons />
            </div>
            <h1 className="title-caps mt-2 text-4xl sm:text-6xl">{p.first_name} <span className="text-neon">{p.last_name}</span></h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
              <Link to={`/equipes/${t?.id}`} className="flex items-center gap-2 hover:text-neon"><TeamLogo team={t} size={22} />{t?.name}</Link>
              {p.number != null && <span>n°{p.number}</span>}{p.birth_date && <span>{ageAt(p.birth_date)} ans</span>}
            </div>
            {titles.length > 0 && <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">{titles.slice(0, 3).map((x) => <span key={x.key} className="rounded-full bg-award-gold/15 px-3 py-1 text-xs font-bold text-award-gold">★ {x.label}</span>)}</div>}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <HeroStat label="XP saison" value={s?.xp ?? 0} accent />
              <HeroStat label="Rang joueurs" value={me ? ordinal(me.rank) : '—'} sub={me ? <span className="inline-flex items-center gap-1">Top {Math.max(1, Math.ceil((me.rank / ranking.length) * 100))} % · <RankDelta delta={me.delta} /></span> : undefined} />
              <HeroStat label="Rang buteurs" value={scorerRank ? ordinal(scorerRank.rank) : '—'} sub={`${s?.goals ?? 0} buts`} />
              <HeroStat label="Badges" value={`${unlocked} / ${badges.length}`} sub={next[0] ? `Prochain : ${next[0].def.name}` : undefined} />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {keeper
          ? <><Tile label="Arrêts" value={s?.saves ?? 0} /><Tile label="Clean sheets" value={s?.clean_sheets ?? 0} /></>
          : <><Tile label="Buts" value={s?.goals ?? 0} /><Tile label="Passes décisives" value={s?.assists ?? 0} /></>}
        <Tile label="Matchs avec stats" value={log.length} />
        <Tile label="Série en cours" value={streak.current} sub={`record ${streak.record} · matchs décisifs d'affilée`} icon={<Flame className="size-4 text-neon" />} />
        <Tile label="Meilleure note" value={best ? best.toFixed(1).replace('.', ',') : '—'} sub="sur 10" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Tirs" value={fmtShots(s?.shot, 'shots')} sub={s?.shot.matches ? `sur ${s.shot.matches} match(s) saisis` : 'tirs non saisis'} />
        <Tile label="Tirs cadrés" value={fmtShots(s?.shot, 'on_target')} sub="buts compris" />
        <Tile label="Précision" value={fmtAccuracy(s?.shot)} sub="tirs cadrés / tirs" />
        <Tile label="Tirs par but" value={fmtShotsPerGoal(s?.shot)} sub="tirs nécessaires pour marquer" />
      </div>

      {/* DÉFIS + RIVALITÉ + TITRES */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-display text-2xl font-black"><Target className="size-5 text-neon" />Défis{upcoming ? ` · Journée ${nextRound}` : last ? ` · Journée ${last.round}` : ''}</h2>
          <p className="mt-1 text-xs text-muted-foreground">Objectifs calculés sur les 5 derniers matchs du joueur.</p>
          {upcoming ? (
            <ul className="mt-4 space-y-2">
              {upcoming.map((c) => <li key={c.id} className="flex items-center gap-3 rounded-xl bg-white/[.04] px-3 py-2.5 text-sm"><Circle className="size-4 shrink-0 text-sky" />{c.label}</li>)}
              <li className="flex items-center gap-3 rounded-xl border border-dashed border-award-gold/40 px-3 py-2.5 text-sm"><Medal className="size-4 shrink-0 text-award-gold" />Bonus : les 3 défis réussis débloquent le badge Perfectionniste</li>
            </ul>
          ) : null}
          {last ? (
            <div className={cn(upcoming ? 'mt-5 border-t border-white/10 pt-4' : 'mt-4')}>
              {upcoming && <div className="mb-2 text-xs font-bold text-muted-foreground">Dernière journée (J{last.round}) : {last.done} / 3 réussis</div>}
              <ul className="space-y-2">
                {last.items.map((c) => (
                  <li key={c.id} className={cn('flex items-center gap-3 rounded-xl px-3 py-2 text-sm', c.done ? 'bg-win/10' : 'bg-white/[.03] text-muted-foreground')}>
                    {c.done ? <Check className="size-4 shrink-0 text-win" /> : <Circle className="size-4 shrink-0 opacity-40" />}
                    <span className="flex-1">{c.label}</span>
                    <span className="num text-base">{c.id === 'rating' ? (c.value ?? 0).toFixed(1).replace('.', ',') : c.value}</span>
                  </li>
                ))}
              </ul>
              {!upcoming && <p className="mt-3 text-sm text-muted-foreground">{last.done} / 3 défis réussis lors de la dernière journée de la saison.</p>}
            </div>
          ) : !upcoming && <p className="mt-4 text-sm text-muted-foreground">Les défis apparaissent après 2 matchs joués.</p>}
        </section>

        <section className="glass rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-display text-2xl font-black"><Swords className="size-5 text-sky" />Défends ta place</h2>
          {me ? (
            <div className="mt-4 space-y-3">
              {above ? <Rival label={`Pour dépasser le ${ordinal(above.rank)}`} name={playerShort(L.player.get(above.item.player_id))} href={`/joueurs/${above.item.player_id}`} gap={above.item.xp - (s?.xp ?? 0)} up />
                : <div className="rounded-xl bg-award-gold/10 p-3 text-sm font-semibold text-award-gold">N°1 du classement XP — à défendre !</div>}
              {below && <Rival label={`Poursuivant (${ordinal(below.rank)})`} name={playerShort(L.player.get(below.item.player_id))} href={`/joueurs/${below.item.player_id}`} gap={(s?.xp ?? 0) - below.item.xp} />}
              <p className="text-xs text-muted-foreground">Rang {ordinal(me.rank)} sur {ranking.length} joueurs classés.</p>
            </div>
          ) : <p className="mt-4 text-sm text-muted-foreground">Pas encore classé cette saison.</p>}
        </section>

        <section className="glass rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-display text-2xl font-black"><Trophy className="size-5 text-award-gold" />Titres</h2>
          {titles.length
            ? <ul className="mt-4 space-y-2">{titles.map((x) => <li key={x.key} className="flex items-center gap-2 rounded-xl bg-award-gold/10 px-3 py-2 text-sm font-semibold text-award-gold">★ {x.label}</li>)}</ul>
            : <p className="mt-4 text-sm text-muted-foreground">Aucun titre pour l’instant. Prochain titre accessible : Joueur du mois, attribué chaque mois par la ligue.</p>}
        </section>
      </div>

      <PlayerDisciplineCard playerId={p.id} seasonId={sid} />

      {/* PROCHAINS BADGES */}
      {next.length > 0 && (
        <section>
          <SectionTitle title="Prochains badges" subtitle="Les plus proches d’être débloqués" />
          <div className="grid gap-3 md:grid-cols-3">
            {next.map((b) => (
              <div key={b.def.id} className="glass flex items-center gap-4 rounded-2xl p-4">
                <BadgeMedal b={b} size={54} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-extrabold leading-none">{b.def.name} <span className="text-xs font-semibold text-muted-foreground">· {RARITY_LABEL[badgeMeta(b.def.id, settings.badge_rarity).rarity]}</span></div>
                  <div className="mt-1 text-xs text-muted-foreground">{b.def.description}</div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-neon" style={{ width: `${b.pct}%` }} /></div>
                  <div className="mt-1 text-xs"><span className="num text-sm">{b.value} / {b.def.target}</span> · {b.pct} %</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* COLLECTION */}
      <section>
        <SectionTitle title="Collection de badges" subtitle="Touchez un badge pour voir sa condition exacte, ses paliers et qui l’a obtenu" />
        <BadgeCollection badges={badges} seasonId={sid} />
        <p className="mt-3 text-xs text-muted-foreground">{BADGES.length} badges au total, dont {BADGES.filter((b) => b.keeperOnly).length} réservés aux gardiens. {RATING_RULES} Le Match des capitaines ne débloque aucun badge.</p>
      </section>

      {/* XP PAR JOURNÉE */}
      {chart.length > 0 && (
        <ChartBox title="XP par journée" legend={<Legend items={[{ label: 'Gain', color: SERIES[0] }, { label: 'Perte', color: SERIES[1] }]} />}>
          <ResponsiveContainer><BarChart data={chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid {...GRID} /><XAxis dataKey="label" {...AXIS} /><YAxis {...AXIS} /><ReferenceLine y={0} stroke="rgba(255,255,255,.25)" />
            <Tooltip {...TOOLTIP} formatter={(v) => [`${v} XP`, 'XP']} labelFormatter={(_, pl) => { const m = pl?.[0]?.payload?.match; return m ? `${m.round ? 'J' + m.round : ''} · ${L.team.get(m.home_team_id)?.short_name} ${m.home_score}-${m.away_score} ${L.team.get(m.away_team_id)?.short_name}` : '' }} />
            <Bar dataKey="xp" radius={[4, 4, 4, 4]} maxBarSize={22}>{chart.map((c, i) => <Cell key={i} fill={c.xp >= 0 ? SERIES[0] : SERIES[1]} />)}</Bar>
          </BarChart></ResponsiveContainer>
        </ChartBox>
      )}

      {/* DÉTAIL DE L'XP */}
      <section className="glass rounded-2xl p-2 sm:p-4">
        <h2 className="px-2 pt-2 font-display text-2xl font-black">Détail de l’XP</h2>
        <SortableTable rows={xpRows} rowKey={(r) => r.m.id} initial={{ key: 'date', dir: 'asc' }} columns={[
          { key: 'date', label: 'Date', first: 'asc', className: 'whitespace-nowrap text-xs text-muted-foreground', sort: (r) => r.m.date ?? '', render: (r) => <Link to={`/matchs/${r.m.id}`} className="hover:text-neon">{fmtDate(r.m.date, 'dd/MM')} · J{r.m.round}</Link> },
          { key: 'opp', label: 'Adversaire', sort: (r) => r.opp?.name, render: (r) => <span className="flex items-center gap-2 text-sm"><TeamLogo team={r.opp} size={18} /><span className="truncate">{r.opp?.name}</span>{r.oppRank ? <span className="text-xs text-muted-foreground">({ordinal(r.oppRank)})</span> : null}</span> },
          { key: 'goals', label: 'B', title: 'Buts', headClassName: 'text-center', className: 'num text-center', sort: (r) => r.goals, render: (r) => r.goals },
          { key: 'assists', label: 'PD', title: 'Passes décisives', headClassName: 'text-center', className: 'num text-center', sort: (r) => r.assists, render: (r) => r.assists },
          { key: 'mult', label: 'Import.', title: "Multiplicateur selon le rang de l'adversaire", headClassName: 'text-center', className: 'text-center text-xs', sort: (r) => r.mult || null, render: (r) => (r.mult ? `×${String(r.mult).replace('.', ',')}` : '—') },
          { key: 'result', label: 'Résultat', headClassName: 'text-center', sort: (r) => r.result, className: 'num text-center', render: (r) => <span className={r.result > 0 ? 'text-win' : r.result < 0 ? 'text-loss' : 'text-muted-foreground'}>{r.result ? pts(r.result) : '0'}</span> },
          { key: 'sanctions', label: 'Sanctions', headClassName: 'text-center', first: 'asc', sort: (r) => r.sanctions, className: 'num text-center', render: (r) => <span className={r.sanctions < 0 ? 'text-loss' : 'text-muted-foreground'}>{r.sanctions ? pts(r.sanctions) : '0'}</span> },
          ...(keeper ? [{ key: 'keeper', label: 'Gardien', headClassName: 'text-center', className: 'num text-center', sort: (r: (typeof xpRows)[number]) => r.keeper, render: (r: (typeof xpRows)[number]) => (r.keeper ? pts(r.keeper) : '0') }] : []),
          { key: 'rating', label: 'Note', headClassName: 'text-center', className: 'num text-center', sort: (r) => r.rating, render: (r) => (r.rating != null ? r.rating.toFixed(1).replace('.', ',') : '—') },
          { key: 'total', label: 'XP', headClassName: 'text-right', sort: (r) => r.total, className: 'num text-right text-lg', render: (r) => <span className={r.total >= 0 ? 'text-neon' : 'text-sky'}>{pts(r.total)}</span> },
        ]} />
        {offMatch.length > 0 && (
          <ul className="mt-2 divide-y divide-white/5 border-t border-white/10 px-2">
            {offMatch.map((l, i) => <li key={i} className="flex items-center justify-between py-2 text-sm text-muted-foreground"><span>{l.label}{l.detail ? ` · ${l.detail}` : ''}</span><span className="num text-lg text-neon">{pts(l.points)}</span></li>)}
          </ul>
        )}
        {!xpRows.length && !offMatch.length && <p className="p-3 text-sm text-muted-foreground">Pas encore d’XP cette saison.</p>}
      </section>

      <section className="glass rounded-2xl p-2 sm:p-4">
        <h2 className="px-2 pt-2 font-display text-2xl font-black">Historique par saison</h2>
        <SortableTable rows={history} rowKey={(h) => h.season.id} initial={{ key: 'season', dir: 'desc' }} columns={[
          { key: 'season', label: 'Saison', sort: (h) => h.season.start_date, render: (h) => h.season.name },
          { key: 'mj', label: 'MJ', title: 'Matchs joués', headClassName: 'text-center', className: 'num text-center', sort: (h) => h.x?.matches ?? 0, render: (h) => h.x?.matches ?? 0 },
          { key: 'goals', label: 'Buts', headClassName: 'text-center', className: 'num text-center', sort: (h) => h.x?.goals ?? 0, render: (h) => h.x?.goals ?? 0 },
          { key: 'assists', label: 'Passes', headClassName: 'text-center', className: 'num text-center', sort: (h) => h.x?.assists ?? 0, render: (h) => h.x?.assists ?? 0 },
          ...shotColumns<(typeof history)[number]>((h) => h.x?.shot, 'hidden sm:table-cell'),
          { key: 'xp', label: 'XP', headClassName: 'text-center', className: 'num text-center text-neon', sort: (h) => h.x?.xp ?? 0, render: (h) => h.x?.xp ?? 0 },
        ]} />
      </section>
      <p className="text-xs text-muted-foreground">{playerName(p)} · XP calculé selon le barème de la saison, recalculé depuis les événements de match.</p>
    </div>
  )
}

function HeroStat({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-black/20 px-3 py-2.5 text-left">
      <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
      <div className={cn('num text-2xl leading-tight', accent && 'text-neon')}>{value}</div>
      {sub && <div className="truncate text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

function Tile({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: string; icon?: ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">{icon}{label}</div>
      <div className="num mt-1 text-3xl">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

function Rival({ label, name, href, gap, up }: { label: string; name: string; href: string; gap: number; up?: boolean }) {
  const goals = Math.max(1, Math.ceil(gap / 50))
  return (
    <Link to={href} className="block rounded-xl bg-white/[.04] p-3 transition hover:bg-white/[.08]">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="truncate font-semibold">{name}</span>
        <span className={cn('num text-xl', up ? 'text-neon' : 'text-sky')}>{up ? '+' : ''}{gap} XP</span>
      </div>
      <div className="text-xs text-muted-foreground">{up ? `Il te manque environ ${goals} but${goals > 1 ? 's' : ''}` : `Ton avance vaut environ ${goals} but${goals > 1 ? 's' : ''}`}</div>
    </Link>
  )
}
