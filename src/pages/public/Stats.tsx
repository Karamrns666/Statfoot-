import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Goal, Handshake, Hand, Square, CalendarDays, ShieldCheck } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useTeamStats } from '@/hooks/useStats'
import { PageHeader, StatTile } from '@/components/league/Bits'
import { AXIS, ChartBox, GRID, SERIES, TOOLTIP } from '@/components/charts/theme'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TeamLogo } from '@/components/league/Identity'
import { bestAttack, bestDefense, kpis, type PhaseFilter } from '@/lib/stats'
import { cn } from '@/lib/utils'

export default function Stats() {
  const { league } = useData()
  const L = useLookup()
  const { scopeSeasonId } = useSeason()
  const [phase, setPhase] = useState<PhaseFilter>('all')
  const hasCups = league.competitions.some((c) => (!scopeSeasonId || c.season_id === scopeSeasonId) && (c.phase === 'gold' || c.phase === 'silver'))
  const scope = { seasonId: scopeSeasonId, phase }
  const k = useMemo(() => kpis(league, scope), [league, scopeSeasonId, phase]) // eslint-disable-line react-hooks/exhaustive-deps
  const ts = [...useTeamStats(scope).values()].filter((t) => t.played > 0)
  const goalsByTeam = [...ts].sort((a, b) => b.gf - a.gf).map((t) => ({ name: L.team.get(t.team_id)?.short_name, gf: t.gf }))
  return (
    <div className="space-y-8">
      <PageHeader title="Statistiques" subtitle="Leaders et chiffres clés">
        {hasCups && (['all', 'league_phase', 'gold', 'silver'] as const).map((p) => <button key={p} onClick={() => setPhase(p)} className={cn('rounded-full border px-3 py-1 text-xs font-bold uppercase cursor-pointer', phase === p ? 'border-neon bg-neon/15 text-neon' : 'border-white/10 text-muted-foreground')}>{{ all: 'Saison', league_phase: 'Phase de ligue', gold: 'Gold', silver: 'Silver' }[p]}</button>)}
      </PageHeader>
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
        {[{ title: 'Meilleures défenses', list: bestDefense(ts), val: (t: typeof ts[0]) => `${t.ga} BC · ${t.ga_avg}/m` }, { title: 'Attaques les plus prolifiques', list: bestAttack(ts), val: (t: typeof ts[0]) => `${t.gf} BP · ${t.gf_avg}/m` }].map((b) => (
          <Card key={b.title}><CardHeader><CardTitle>{b.title}</CardTitle></CardHeader><CardContent>
            <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Équipe</TableHead><TableHead className="text-center">MJ</TableHead><TableHead className="text-right">Valeur</TableHead></TableRow></TableHeader>
              <TableBody>{b.list.slice(0, 6).map((t, i) => <TableRow key={t.team_id}><TableCell className="num">{i + 1}</TableCell><TableCell><span className="flex items-center gap-2"><TeamLogo team={L.team.get(t.team_id)} size={20} />{L.team.get(t.team_id)?.name}</span></TableCell><TableCell className="num text-center">{t.played}</TableCell><TableCell className="num text-right">{b.val(t)}</TableCell></TableRow>)}</TableBody></Table>
          </CardContent></Card>
        ))}
      </div>
    </div>
  )
}
