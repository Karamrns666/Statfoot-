import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useEffectiveSeason, useRace } from '@/hooks/useStats'
import { EmptyState, RankDelta, RookieBadge, StatTile } from '@/components/league/Bits'
import { PlayerAvatar, PositionBadge, TeamLogo } from '@/components/league/Identity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AXIS, ChartBox, GRID, Legend, SERIES, TOOLTIP } from '@/components/charts/theme'
import { computePlayerXP, isRookie, ageAt, type XPLine } from '@/lib/stats'
import { fmtDate, POSITION_LONG, playerName } from '@/lib/format'

export default function PlayerDetail() {
  const { id } = useParams()
  const { db, league } = useData()
  const L = useLookup()
  const { scopeSeasonId, seasons } = useSeason()
  const eff = useEffectiveSeason()
  const sid = scopeSeasonId ?? eff?.id ?? null
  const p = L.player.get(id ?? '')
  // même fonction que Trophées et l'accueil : raceWithEvolution → computePlayerXP
  const ranking = useRace({ seasonId: sid }, 'xp')
  const me = ranking.find((r) => r.item.player_id === id)
  const history = useMemo(() => seasons.filter((s) => p?.season_ids?.includes(s.id)).map((s) => ({ season: s, x: computePlayerXP(league, { seasonId: s.id }).get(id ?? '') })), [seasons, league, id, p])
  if (!p) return <EmptyState title="Joueur introuvable" />
  const t = L.team.get(p.team_id)
  const s = me?.item
  const chart = (s?.byMatch ?? []).map((b) => { const m = db.Match.find((x) => x.id === b.match_id)!; return { label: `J${m.round}`, xp: b.xp, match: m } }).sort((a, b) => (a.match.date ?? '').localeCompare(b.match.date ?? ''))
  const linesByMatch = new Map<string, XPLine[]>()
  for (const l of s?.lines ?? []) { const k = l.match_id ?? `hors-match-${l.key}-${l.detail}`; if (!linesByMatch.has(k)) linesByMatch.set(k, []); linesByMatch.get(k)!.push(l) }
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8" style={{ background: `radial-gradient(ellipse 60% 100% at 100% 0%, ${t?.primary_color}40, transparent 70%), linear-gradient(180deg,#0D2B66,#04163D)` }}>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <PlayerAvatar player={p} team={t} size={132} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start"><PositionBadge position={p.position} />{isRookie(p) && <RookieBadge />}{p.is_captain && <span className="rounded bg-award-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase text-award-gold">Capitaine</span>}</div>
            <h1 className="title-caps mt-2 text-4xl sm:text-6xl">{p.first_name} <span className="text-neon">{p.last_name}</span></h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
              <Link to={`/equipes/${t?.id}`} className="flex items-center gap-2 hover:text-neon"><TeamLogo team={t} size={22} />{t?.name}</Link>
              <span>#{p.number}</span><span>{POSITION_LONG[p.position]}</span>{p.birth_date && <span>{ageAt(p.birth_date)} ans</span>}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rang XP</div>
            <div className="num text-6xl text-neon neon-text">{me ? me.rank : '—'}</div>
            <RankDelta delta={me?.delta} />
          </div>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="XP" value={s?.xp ?? 0} />
        <StatTile label="Matchs joués" value={s?.matches ?? 0} color="#e6edf8" />
        {p.position === 'GK'
          ? <><StatTile label="Clean sheets" value={s?.clean_sheets ?? 0} color="#3b82f6" /><StatTile label="Arrêts" value={s?.saves ?? 0} color="#3b82f6" sub={`${s?.conceded ?? 0} buts encaissés`} /></>
          : <><StatTile label="Buts" value={s?.goals ?? 0} color="#ef4444" /><StatTile label="Passes déc." value={s?.assists ?? 0} color="#f97316" /></>}
      </div>
      {chart.length > 0 && (
        <ChartBox title="XP par match" legend={<Legend items={[{ label: 'Gain', color: SERIES[0] }, { label: 'Perte', color: SERIES[1] }]} />}>
          <ResponsiveContainer><BarChart data={chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid {...GRID} /><XAxis dataKey="label" {...AXIS} /><YAxis {...AXIS} /><ReferenceLine y={0} stroke="rgba(255,255,255,.25)" />
            <Tooltip {...TOOLTIP} formatter={(v) => [`${v} XP`, 'XP']} labelFormatter={(_, pl) => { const m = pl?.[0]?.payload?.match; return m ? `${m.round ? 'J' + m.round : ''} · ${L.team.get(m.home_team_id)?.short_name} ${m.home_score}-${m.away_score} ${L.team.get(m.away_team_id)?.short_name}` : '' }} />
            <Bar dataKey="xp" radius={[4, 4, 4, 4]} maxBarSize={22}>{chart.map((c, i) => <Cell key={i} fill={c.xp >= 0 ? SERIES[0] : SERIES[1]} />)}</Bar>
          </BarChart></ResponsiveContainer>
        </ChartBox>
      )}
      <Card>
        <CardHeader><CardTitle>Historique XP par match</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[...linesByMatch.entries()].reverse().map(([k, lines]) => {
            const m = db.Match.find((x) => x.id === k)
            const total = lines.reduce((a, l) => a + l.points, 0)
            return (
              <details key={k} className="rounded-xl bg-white/[.03] px-3 py-2">
                <summary className="flex cursor-pointer list-none items-center gap-3 text-sm">
                  {m ? <><span className="w-14 text-xs text-muted-foreground">{fmtDate(m.date, 'd MMM')}</span><span className="text-xs text-muted-foreground">J{m.round}</span><Link to={`/matchs/${m.id}`} className="flex-1 truncate hover:text-neon">{L.team.get(m.home_team_id)?.short_name} {m.home_score}-{m.away_score} {L.team.get(m.away_team_id)?.short_name}</Link></>
                    : <span className="flex-1">{lines[0].label} · {lines[0].detail}</span>}
                  <span className={`num text-lg ${total >= 0 ? 'text-neon' : 'text-sky-400'}`}>{total > 0 ? '+' : ''}{total}</span>
                </summary>
                <ul className="mt-2 space-y-1 border-t border-white/5 pt-2 text-xs">
                  {lines.map((l, i) => <li key={i} className="flex justify-between gap-2 text-muted-foreground"><span>{l.label}{l.count > 1 ? ` ×${l.count}` : ''}{l.detail ? ` · ${l.detail}` : ''}</span><span className="num text-sm text-white">{l.points > 0 ? '+' : ''}{l.points}</span></li>)}
                </ul>
              </details>
            )
          })}
          {!linesByMatch.size && <p className="text-sm text-muted-foreground">Pas encore d'XP cette saison.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Historique par saison</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Saison</TableHead><TableHead className="text-center">MJ</TableHead><TableHead className="text-center">Buts</TableHead><TableHead className="text-center">Passes</TableHead><TableHead className="text-center">XP</TableHead></TableRow></TableHeader>
            <TableBody>{history.map(({ season, x }) => <TableRow key={season.id}><TableCell>{season.name}</TableCell><TableCell className="num text-center">{x?.matches ?? 0}</TableCell><TableCell className="num text-center">{x?.goals ?? 0}</TableCell><TableCell className="num text-center">{x?.assists ?? 0}</TableCell><TableCell className="num text-center text-neon">{x?.xp ?? 0}</TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{playerName(p)} · Calcul XP selon le barème de la saison, recalculé depuis les événements de match.</p>
    </div>
  )
}
