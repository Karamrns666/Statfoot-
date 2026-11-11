import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { phaseName } from '@/lib/competitionNames'
import { Goal, Handshake, Hand, Square, CalendarDays, ShieldCheck } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { usePlayerXP, useTeamStats } from '@/hooks/useStats'
import { PageHeader, StatTile } from '@/components/league/Bits'
import { AXIS, ChartBox, GRID, SERIES, TOOLTIP } from '@/components/charts/theme'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { SortableTable, type SortColumn } from '@/components/league/SortableTable'
import { shotColumns } from '@/components/league/shotColumns'
import { playerName } from '@/lib/format'
import { TeamLogo } from '@/components/league/Identity'
import { bestAttack, bestDefense, kpis, type PhaseFilter, type PlayerXP, type TeamStats } from '@/lib/stats'
import { cn } from '@/lib/utils'
import { SeasonNotStarted } from '@/components/league/SeasonNotStarted'

export default function Stats() {
  const { league } = useData()
  const L = useLookup()
  const { scopeSeasonId } = useSeason()
  const [phase, setPhase] = useState<PhaseFilter>('all')
  const hasCups = league.competitions.some((c) => (!scopeSeasonId || c.season_id === scopeSeasonId) && (c.phase === 'gold' || c.phase === 'silver'))
  const scope = { seasonId: scopeSeasonId, phase }
  const k = useMemo(() => kpis(league, scope), [league, scopeSeasonId, phase]) // eslint-disable-line react-hooks/exhaustive-deps
  const ts = [...useTeamStats(scope).values()].filter((t) => t.played > 0)
  const xp = usePlayerXP(scope)
  const players = useMemo(() => [...xp.values()].filter((p) => p.matches > 0).sort((a, b) => b.goals - a.goals || b.assists - a.assists || b.xp - a.xp), [xp])
  const teamCol: SortColumn<TeamStats> = { key: 'team', label: 'Équipe', sort: (t) => L.team.get(t.team_id)?.name, render: (t) => <Link to={`/equipes/${t.team_id}`} className="flex items-center gap-2 hover:text-neon"><TeamLogo team={L.team.get(t.team_id)} size={20} /><span className="font-semibold">{L.team.get(t.team_id)?.name}</span></Link> }
  const goalsByTeam = [...ts].sort((a, b) => b.gf - a.gf).map((t) => ({ name: L.team.get(t.team_id)?.short_name, gf: t.gf }))
  return (
    <div className="space-y-8">
      <PageHeader title="Statistiques" subtitle="Leaders et chiffres clés">
        <Link to="/discipline" className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold uppercase text-muted-foreground hover:border-neon hover:text-neon">Discipline</Link>
        {hasCups && (['all', 'league_phase', 'gold', 'silver'] as const).filter((x) => x === 'all' || league.competitions.some((c) => (!scopeSeasonId || c.season_id === scopeSeasonId) && c.phase === x)).map((p) => <button key={p} onClick={() => setPhase(p)} className={cn('rounded-full border px-3 py-1 text-xs font-bold uppercase cursor-pointer', phase === p ? 'border-neon bg-neon/15 text-neon' : 'border-white/10 text-muted-foreground')}>{{ all: 'Toutes', league_phase: 'Phase de ligue', gold: phaseName('gold'), silver: phaseName('silver') }[p]}</button>)}
      </PageHeader>
      {k.matches === 0 ? <SeasonNotStarted what="Les statistiques" /> : <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Matchs" value={k.matches} icon={<CalendarDays />} color="#e6edf8" />
        <StatTile label="Buts" value={k.goals} icon={<Goal />} sub={`${k.goals_avg} / match`} />
        <StatTile label="Passes déc." value={k.assists} icon={<Handshake />} color="#f97316" />
        <StatTile label="Arrêts" value={k.saves} icon={<Hand />} color="#3b82f6" />
        <StatTile label="Clean sheets" value={k.clean_sheets} icon={<ShieldCheck />} color="#22c55e" />
        <StatTile label="Cartons" value={`${k.yellow}/${k.red}`} icon={<Square />} color="#facc15" sub="jaunes / rouges" />
      </div>
      <ChartBox title="Buts marqués par équipe" height={280}>
        <ResponsiveContainer><BarChart data={goalsByTeam} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid {...GRID} /><XAxis dataKey="name" {...AXIS} interval={0} angle={-45} textAnchor="end" height={50} /><YAxis {...AXIS} allowDecimals={false} />
          <Tooltip {...TOOLTIP} formatter={(v) => [`${v} buts`, 'Buts']} /><Bar dataKey="gf" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart></ResponsiveContainer>
      </ChartBox>
      <div className="grid gap-4 lg:grid-cols-2">
        {[{ title: 'Meilleures défenses', list: bestDefense(ts), key: 'ga_avg', label: 'BC / m', title2: 'Buts encaissés par match', v: (t: TeamStats) => t.ga_avg, first: 'asc' as const },
          { title: 'Attaques les plus prolifiques', list: bestAttack(ts), key: 'gf', label: 'BP', title2: 'Buts marqués', v: (t: TeamStats) => t.gf, first: 'desc' as const }].map((b) => (
          <Card key={b.title}><CardHeader><CardTitle>{b.title}</CardTitle></CardHeader><CardContent>
            <SortableTable rows={b.list.slice(0, 6).map((t, i) => ({ ...t, pos: i + 1 }))} rowKey={(t) => t.team_id} initial={{ key: 'pos', dir: 'asc' }} columns={[
              { key: 'pos', label: '#', first: 'asc', className: 'num', sort: (t) => t.pos, render: (t) => t.pos },
              teamCol,
              { key: 'played', label: 'MJ', title: 'Matchs joués', headClassName: 'text-center', className: 'num text-center', sort: (t) => t.played, render: (t) => t.played },
              { key: b.key, label: b.label, title: b.title2, first: b.first, headClassName: 'text-right', className: 'num text-right', sort: b.v, render: (t) => (b.key === 'gf' ? `${t.gf} · ${t.gf_avg}/m` : `${t.ga_avg} · ${t.ga} BC`) },
            ]} />
          </CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle>Équipes</CardTitle></CardHeader><CardContent className="px-1 sm:px-4">
        <SortableTable rows={[...ts].sort((a, b) => b.points - a.points || b.gf - b.ga - (a.gf - a.ga))} rowKey={(t) => t.team_id} initial={{ key: 'points', dir: 'desc' }} columns={[
          teamCol,
          { key: 'played', label: 'MJ', title: 'Matchs joués', headClassName: 'text-center', className: 'num text-center', sort: (t) => t.played, render: (t) => t.played },
          { key: 'points', label: 'Pts', title: 'Points', headClassName: 'text-center', className: 'num text-center text-white', sort: (t) => t.points, render: (t) => t.points },
          { key: 'gf', label: 'BP', title: 'Buts marqués', headClassName: 'text-center', className: 'num text-center', sort: (t) => t.gf, render: (t) => t.gf },
          { key: 'ga', label: 'BC', title: 'Buts encaissés', first: 'asc', headClassName: 'text-center', className: 'num text-center', sort: (t) => t.ga, render: (t) => t.ga },
          ...shotColumns<TeamStats>((t) => t.shot),
        ]} />
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Joueurs</CardTitle></CardHeader><CardContent className="max-h-[70vh] overflow-y-auto px-1 sm:px-4">
        <SortableTable rows={players} rowKey={(p) => p.player_id} initial={{ key: 'goals', dir: 'desc' }} columns={[
          { key: 'name', label: 'Joueur', sort: (p) => playerName(L.player.get(p.player_id)), render: (p) => <Link to={`/joueurs/${p.player_id}`} className="flex items-center gap-2 hover:text-neon"><TeamLogo team={L.team.get(p.team_id)} size={20} /><span className="font-semibold">{playerName(L.player.get(p.player_id))}</span></Link> },
          { key: 'played', label: 'MJ', title: 'Matchs joués', headClassName: 'text-center', className: 'num text-center', sort: (p) => p.matches, render: (p) => p.matches },
          { key: 'goals', label: 'Buts', headClassName: 'text-center', className: 'num text-center', sort: (p) => p.goals, render: (p) => p.goals },
          { key: 'assists', label: 'Passes', title: 'Passes décisives', headClassName: 'text-center', className: 'num text-center', sort: (p) => p.assists, render: (p) => p.assists },
          ...shotColumns<PlayerXP>((p) => p.shot),
          { key: 'xp', label: 'XP', headClassName: 'text-center', className: 'num text-center text-neon', sort: (p) => p.xp, render: (p) => p.xp },
        ]} />
      </CardContent></Card>
      </>}
    </div>
  )
}
