import { useMemo, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Check, Circle, Flame, Medal, Swords, Target, Trophy } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useEffectiveSeason, useRace } from '@/hooks/useStats'
import { EmptyState, RankDelta, RookieBadge, SectionTitle } from '@/components/league/Bits'
import { PlayerAvatar, PositionBadge, TeamLogo } from '@/components/league/Identity'
import { MaterialLegend, XPCard } from '@/components/players/Cards'
import { BadgeMedal, BadgeTile } from '@/components/players/BadgeMedal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AXIS, ChartBox, GRID, Legend, SERIES, TOOLTIP } from '@/components/charts/theme'
import { AWARD_LABELS, computePlayerXP, isRookie, ageAt, type XPLine } from '@/lib/stats'
import { BADGES, RATING_RULES, TIER_LABEL, TIER_STYLE, cardMaterial, challengeResult, challengeTargets, decisiveStreak, nextBadges, playerBadges, playerMatchLog, type BadgeGroup } from '@/lib/badges'
import { fmtDate, POSITION_LONG, ordinal, playerName, playerShort } from '@/lib/format'
import { cn } from '@/lib/utils'

const GROUPS: BadgeGroup[] = ['Buts', 'Passes', 'Polyvalence', 'Régularité', 'Exploits', 'Défis', 'Gardien']
const monthLabel = (m: string) => format(new Date(`${m}-01T12:00:00`), 'MMMM yyyy', { locale: fr })
const pts = (n: number) => `${n > 0 ? '+' : ''}${n}`

export default function PlayerDetail() {
  const { id } = useParams()
  const { db, league } = useData()
  const L = useLookup()
  const { scopeSeasonId, seasons } = useSeason()
  const eff = useEffectiveSeason()
  const sid = scopeSeasonId ?? eff?.id ?? null
  const season = sid ? L.season.get(sid) : undefined
  const p = L.player.get(id ?? '')
  // même fonction que Trophées et l'accueil : raceWithEvolution → computePlayerXP
  const ranking = useRace({ seasonId: sid }, 'xp')
  const scorers = useRace({ seasonId: sid }, 'top_scorer')
  const meIdx = ranking.findIndex((r) => r.item.player_id === id)
  const me = meIdx >= 0 ? ranking[meIdx] : undefined
  const history = useMemo(() => seasons.filter((s) => p?.season_ids?.includes(s.id)).map((s) => ({ season: s, x: computePlayerXP(league, { seasonId: s.id }).get(id ?? '') })), [seasons, league, id, p])
  const log = useMemo(() => (id ? playerMatchLog(league, id, sid) : []), [league, id, sid])
  if (!p) return <EmptyState title="Joueur introuvable" />

  const t = L.team.get(p.team_id)
  const s = me?.item
  const keeper = p.position === 'GK' || (s?.gk_matches ?? 0) > 0
  const badges = playerBadges(log, { keeper })
  const unlocked = badges.filter((b) => b.unlocked).length
  const material = cardMaterial(badges)
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
          {me ? <XPCard r={me} player={p} team={t} className="w-56 shrink-0" /> : <PlayerAvatar player={p} team={t} size={132} />}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <PositionBadge position={p.position} />{isRookie(p) && <RookieBadge />}
              {material && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold" style={{ background: `linear-gradient(135deg, ${TIER_STYLE[material].light}, ${TIER_STYLE[material].edge})`, color: material === 'black' ? '#fff' : '#0A0F33' }}>Carte {TIER_LABEL[material]}</span>}
              {p.is_captain && <span className="rounded bg-award-gold/20 px-2 py-0.5 text-[11px] font-bold text-award-gold">Capitaine</span>}
            </div>
            <h1 className="title-caps mt-2 text-4xl sm:text-6xl">{p.first_name} <span className="text-neon">{p.last_name}</span></h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
              <Link to={`/equipes/${t?.id}`} className="flex items-center gap-2 hover:text-neon"><TeamLogo team={t} size={22} />{t?.name}</Link>
              <span>{POSITION_LONG[p.position]}</span>{p.number != null && <span>n°{p.number}</span>}{p.birth_date && <span>{ageAt(p.birth_date)} ans</span>}
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

      {/* PROCHAINS BADGES */}
      {next.length > 0 && (
        <section>
          <SectionTitle title="Prochains badges" subtitle="Les plus proches d’être débloqués" />
          <div className="grid gap-3 md:grid-cols-3">
            {next.map((b) => (
              <div key={b.def.id} className="glass flex items-center gap-4 rounded-2xl p-4">
                <BadgeMedal b={b} size={54} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-extrabold leading-none">{b.def.name} <span className="text-xs font-semibold text-muted-foreground">· {TIER_LABEL[b.def.tier]}</span></div>
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
        <SectionTitle title={`Collection de badges · ${unlocked} / ${badges.length}`} subtitle="La condition de chaque badge est indiquée sous son nom" />
        <MaterialLegend className="mb-4" />
        <div className="space-y-6">
          {GROUPS.map((g) => {
            const list = badges.filter((b) => b.def.group === g)
            if (!list.length) return null
            return (
              <div key={g}>
                <h3 className="mb-2 font-display text-lg font-extrabold text-sky-soft">{g}</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">{list.map((b) => <BadgeTile key={b.def.id} b={b} />)}</div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{BADGES.length} badges au total, dont {BADGES.filter((b) => b.keeperOnly).length} réservés aux gardiens. {RATING_RULES}</p>
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
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Adversaire</TableHead><TableHead className="text-center" title="Buts">B</TableHead><TableHead className="text-center" title="Passes décisives">PD</TableHead>
            <TableHead className="text-center" title="Multiplicateur selon le rang de l'adversaire">Import.</TableHead><TableHead className="text-center">Résultat</TableHead><TableHead className="text-center">Sanctions</TableHead>
            {keeper && <TableHead className="text-center">Gardien</TableHead>}<TableHead className="text-center">Note</TableHead><TableHead className="text-right">XP</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {xpRows.map((r) => (
              <TableRow key={r.m.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground"><Link to={`/matchs/${r.m.id}`} className="hover:text-neon">{fmtDate(r.m.date, 'dd/MM')} · J{r.m.round}</Link></TableCell>
                <TableCell><span className="flex items-center gap-2 text-sm"><TeamLogo team={r.opp} size={18} /><span className="truncate">{r.opp?.name}</span>{r.oppRank ? <span className="text-xs text-muted-foreground">({ordinal(r.oppRank)})</span> : null}</span></TableCell>
                <TableCell className="num text-center">{r.goals}</TableCell><TableCell className="num text-center">{r.assists}</TableCell>
                <TableCell className="text-center text-xs">{r.mult ? `×${String(r.mult).replace('.', ',')}` : '—'}</TableCell>
                <TableCell className={cn('num text-center', r.result > 0 ? 'text-win' : r.result < 0 ? 'text-loss' : 'text-muted-foreground')}>{r.result ? pts(r.result) : '0'}</TableCell>
                <TableCell className={cn('num text-center', r.sanctions < 0 ? 'text-loss' : 'text-muted-foreground')}>{r.sanctions ? pts(r.sanctions) : '0'}</TableCell>
                {keeper && <TableCell className="num text-center">{r.keeper ? pts(r.keeper) : '0'}</TableCell>}
                <TableCell className="num text-center">{r.rating != null ? r.rating.toFixed(1).replace('.', ',') : '—'}</TableCell>
                <TableCell className={cn('num text-right text-lg', r.total >= 0 ? 'text-neon' : 'text-sky')}>{pts(r.total)}</TableCell>
              </TableRow>
            ))}
            {offMatch.map((l, i) => (
              <TableRow key={`off-${i}`}>
                <TableCell colSpan={keeper ? 9 : 8} className="text-sm text-muted-foreground">{l.label}{l.detail ? ` · ${l.detail}` : ''}</TableCell>
                <TableCell className="num text-right text-lg text-neon">{pts(l.points)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!xpRows.length && !offMatch.length && <p className="p-3 text-sm text-muted-foreground">Pas encore d’XP cette saison.</p>}
      </section>

      <section className="glass rounded-2xl p-2 sm:p-4">
        <h2 className="px-2 pt-2 font-display text-2xl font-black">Historique par saison</h2>
        <Table>
          <TableHeader><TableRow><TableHead>Saison</TableHead><TableHead className="text-center">MJ</TableHead><TableHead className="text-center">Buts</TableHead><TableHead className="text-center">Passes</TableHead><TableHead className="text-center">XP</TableHead></TableRow></TableHeader>
          <TableBody>{history.map(({ season: se, x }) => <TableRow key={se.id}><TableCell>{se.name}</TableCell><TableCell className="num text-center">{x?.matches ?? 0}</TableCell><TableCell className="num text-center">{x?.goals ?? 0}</TableCell><TableCell className="num text-center">{x?.assists ?? 0}</TableCell><TableCell className="num text-center text-neon">{x?.xp ?? 0}</TableCell></TableRow>)}</TableBody>
        </Table>
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
