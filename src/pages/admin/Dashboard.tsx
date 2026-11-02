import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, CalendarCheck, CalendarClock, Goal, Plus, Radio, Shield, Square, Trophy, Users, CalendarDays, FileWarning, Gavel } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { AdminPage } from '@/components/admin/AdminLayout'
import { StatTile } from '@/components/league/Bits'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamLogo } from '@/components/league/Identity'
import { AXIS, ChartBox, GRID, SERIES, TOOLTIP } from '@/components/charts/theme'
import { computePlayerXP, computeTeamStats, isPlayed, kpis } from '@/lib/stats'
import { fmtScore } from '@/lib/matchEngine'
import { fmtDate, fmtTime } from '@/lib/format'
import type { Match } from '@/types/entities'

export default function Dashboard() {
  const { db, league } = useData()
  const L = useLookup()
  const { seasonId, competitionId } = useAdminScope()
  const scope = { seasonId, competitionId: competitionId || null }
  const ms = db.Match.filter((m) => m.season_id === seasonId && (!competitionId || m.competition_id === competitionId))
  const k = useMemo(() => kpis(league, scope), [league, seasonId, competitionId]) // eslint-disable-line react-hooks/exhaustive-deps
  const comps = db.Competition.filter((c) => c.season_id === seasonId)
  const teamIds = new Set(comps.flatMap((c) => c.team_ids ?? []))
  const players = db.Player.filter((p) => p.season_ids?.includes(seasonId))
  const today = new Date().toISOString().slice(0, 10)
  const todays = ms.filter((m) => (m.date ?? '').slice(0, 10) === today).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  const recent = ms.filter(isPlayed).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 6)
  const upcoming = ms.filter((m) => m.status === 'scheduled' && (m.date ?? '') >= new Date().toISOString()).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')).slice(0, 6)
  const goalsByTeam = useMemo(() => [...computeTeamStats(league, scope).values()].filter((t) => t.played).sort((a, b) => b.gf - a.gf).map((t) => ({ name: L.team.get(t.team_id)?.short_name, gf: t.gf })), [league, seasonId, competitionId]) // eslint-disable-line react-hooks/exhaustive-deps
  const participation = useMemo(() => {
    const x = [...computePlayerXP(league, scope).values()]
    const buckets = new Map<number, number>()
    for (const s of x) buckets.set(s.matches, (buckets.get(s.matches) ?? 0) + 1)
    return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([mj, n]) => ({ mj: `${mj} MJ`, n }))
  }, [league, seasonId, competitionId]) // eslint-disable-line react-hooks/exhaustive-deps
  // alertes
  const docsKo = players.filter((p) => (['id_card', 'medical', 'license'] as const).some((d) => p.documents?.[d]?.status !== 'valid'))
  const pastOpen = ms.filter((m) => (m.status === 'scheduled' || m.status === 'live') && (m.date ?? '') < new Date(Date.now() - 3 * 3600_000).toISOString())
  const unsigned = ms.filter((m) => m.status === 'finished' && m.sheet?.status !== 'signed')
  const exclusions = db.MatchEvent.filter((e) => (e.type === 'red_card' || e.type === 'second_yellow') && ms.some((m) => m.id === e.match_id) && !db.Suspension.some((s) => s.origin_event_id === e.id))
  const alerts = [
    pastOpen.length && { icon: CalendarClock, text: `${pastOpen.length} match(s) passé(s) non clôturé(s)`, to: '/admin/matchs?statut=scheduled' },
    exclusions.length && { icon: Gavel, text: `${exclusions.length} exclusion(s) sans suspension saisie`, to: '/admin/xp' },
    docsKo.length && { icon: FileWarning, text: `${docsKo.length} joueur(s) avec documents à traiter`, to: '/admin/joueurs' },
    unsigned.length && { icon: AlertTriangle, text: `${unsigned.length} feuille(s) de match non signée(s)`, to: '/admin/matchs' },
  ].filter(Boolean) as { icon: typeof Goal; text: string; to: string }[]
  return (
    <AdminPage title="Tableau de bord" subtitle={`${db.Season.find((s) => s.id === seasonId)?.name ?? ''}${competitionId ? ` · ${L.competition.get(competitionId)?.name}` : ''}`}
      actions={<>
        <Button asChild variant="outline" size="sm"><Link to="/admin/competitions"><Plus />Compétition</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/admin/equipes"><Plus />Équipe</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/admin/joueurs"><Plus />Joueur</Link></Button>
        <Button asChild size="sm"><Link to="/admin/matchs"><Plus />Match</Link></Button>
      </>}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Compétitions" value={comps.length} icon={<Trophy />} color="#e6edf8" />
        <StatTile label="Équipes" value={teamIds.size} icon={<Shield />} color="#e6edf8" />
        <StatTile label="Joueurs" value={players.length} icon={<Users />} color="#e6edf8" />
        <StatTile label="Matchs" value={ms.length} icon={<CalendarDays />} color="#e6edf8" />
        <StatTile label="Terminés" value={ms.filter((m) => m.status === 'finished').length} icon={<CalendarCheck />} color="#22c55e" />
        <StatTile label="À venir" value={ms.filter((m) => m.status === 'scheduled').length} icon={<CalendarClock />} color="#38bdf8" />
        <StatTile label="Buts" value={k.goals} icon={<Goal />} sub={`${k.goals_avg} / match`} />
        <StatTile label="Cartons" value={`${k.yellow} / ${k.red}`} icon={<Square />} color="#facc15" sub="jaunes / rouges" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Radio className="size-5 text-red-400" />Matchs du jour</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">{todays.length ? todays.map((m) => <MatchRow key={m.id} m={m} />) : <p className="text-sm text-muted-foreground">Aucun match aujourd'hui.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-300" />Alertes</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">{alerts.length ? alerts.map((a) => <Link key={a.text} to={a.to} className="flex items-center gap-2 rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-100 hover:bg-amber-400/20"><a.icon className="size-4" />{a.text}</Link>) : <p className="text-sm text-muted-foreground">Rien à signaler.</p>}</CardContent></Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartBox title="Buts par équipe" height={260}>
          <ResponsiveContainer><BarChart data={goalsByTeam} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid {...GRID} /><XAxis dataKey="name" {...AXIS} interval={0} angle={-45} textAnchor="end" height={48} /><YAxis {...AXIS} allowDecimals={false} /><Tooltip {...TOOLTIP} formatter={(v) => [`${v} buts`, 'Buts']} /><Bar dataKey="gf" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={20} /></BarChart></ResponsiveContainer>
        </ChartBox>
        <ChartBox title="Participation des joueurs (nombre de joueurs par matchs joués)" height={260}>
          <ResponsiveContainer><BarChart data={participation} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid {...GRID} /><XAxis dataKey="mj" {...AXIS} /><YAxis {...AXIS} allowDecimals={false} /><Tooltip {...TOOLTIP} formatter={(v) => [`${v} joueurs`, 'Joueurs']} /><Bar dataKey="n" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer>
        </ChartBox>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Matchs récents</CardTitle></CardHeader><CardContent className="space-y-1.5">{recent.map((m) => <MatchRow key={m.id} m={m} />)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Prochains matchs</CardTitle></CardHeader><CardContent className="space-y-1.5">{upcoming.map((m) => <MatchRow key={m.id} m={m} />)}{!upcoming.length && <p className="text-sm text-muted-foreground">—</p>}</CardContent></Card>
      </div>
    </AdminPage>
  )
}

function MatchRow({ m }: { m: Match }) {
  const L = useLookup()
  return (
    <Link to={m.status === 'scheduled' || m.status === 'live' ? `/admin/match-center/${m.id}` : `/admin/matchs/${m.id}/feuille`} className="flex items-center gap-2 rounded-lg bg-white/[.03] px-3 py-2 text-sm hover:bg-white/[.07]">
      <span className="w-20 text-xs text-muted-foreground">{fmtDate(m.date, 'd MMM')} {fmtTime(m.date)}</span>
      <TeamLogo team={L.team.get(m.home_team_id)} size={18} /><span className="font-semibold">{L.team.get(m.home_team_id)?.short_name}</span>
      <span className="num flex-1 text-center">{m.status === 'scheduled' ? 'vs' : fmtScore(m)}</span>
      <span className="font-semibold">{L.team.get(m.away_team_id)?.short_name}</span><TeamLogo team={L.team.get(m.away_team_id)} size={18} />
      {m.status === 'live' && <span className="ml-1 size-2 rounded-full bg-red-500 animate-pulse-live" />}
    </Link>
  )
}
