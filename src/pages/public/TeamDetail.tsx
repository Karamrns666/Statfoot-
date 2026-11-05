import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { usePlayerXP, useTeamStats, useSeasonCompetitions } from '@/hooks/useStats'
import { CompetitionBadge, EmptyState, FormPills, SectionTitle, StatTile } from '@/components/league/Bits'
import { PlayerAvatar, RoleBadge, TeamLogo } from '@/components/league/Identity'
import { MatchCard } from '@/components/match/MatchCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AXIS, ChartBox, GRID, Legend, SERIES, TOOLTIP } from '@/components/charts/theme'
import { competitionStandings, teamForm } from '@/lib/stats'
import { playerName } from '@/lib/format'

// 6 contre 6 : gardiens d'abord, puis les joueurs de champ par numéro
const POS_ORDER: Record<string, number> = { GK: 0, FIELD: 1 }

export default function TeamDetail() {
  const { id } = useParams()
  const { db, league } = useData()
  const L = useLookup()
  const { scopeSeasonId } = useSeason()
  const comps = useSeasonCompetitions()
  const team = L.team.get(id ?? '')
  const ts = useTeamStats({ seasonId: scopeSeasonId }).get(id ?? '')
  const xp = usePlayerXP({ seasonId: scopeSeasonId })
  const squad = useMemo(() => db.Player.filter((p) => p.team_id === id && (!scopeSeasonId || p.season_ids?.includes(scopeSeasonId))).sort((a, b) => (POS_ORDER[a.position] ?? 1) - (POS_ORDER[b.position] ?? 1) || (a.number ?? 0) - (b.number ?? 0)), [db.Player, id, scopeSeasonId])
  const matches = db.Match.filter((m) => (m.home_team_id === id || m.away_team_id === id) && (!scopeSeasonId || m.season_id === scopeSeasonId)).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  if (!team) return <EmptyState title="Équipe introuvable" />
  const cup = comps.find((c) => (c.phase === 'gold' || c.phase === 'silver') && c.team_ids?.includes(team.id)) ?? comps.find((c) => c.team_ids?.includes(team.id))
  const row = cup ? competitionStandings(league, cup.id).find((r) => r.team_id === team.id) : undefined
  const timeline = ts?.timeline ?? []
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8" style={{ background: `radial-gradient(ellipse 60% 100% at 0% 0%, ${team.primary_color}40, transparent 70%), linear-gradient(180deg,#0D2B66,#04163D)` }}>
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <TeamLogo team={team} size={120} />
          <div className="text-center sm:text-left">
            <h1 className="title-caps text-4xl sm:text-6xl">{team.name}</h1>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
              {team.company_logo_url && <img src={team.company_logo_url} alt={team.company ?? ''} className={team.company_logo_url.startsWith('/logos/') ? 'h-10 w-auto rounded-lg bg-white' : 'size-6 rounded'} />}<span>{team.company}</span><CompetitionBadge competition={cup} />{row && <span>{row.rank}e · {row.points} pts</span>}
            </div>
            <div className="mt-3 flex justify-center sm:justify-start"><FormPills form={teamForm(matches, team.id)} size="md" /></div>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile label="Matchs joués" value={ts?.played ?? 0} sub={`${ts?.won ?? 0} V · ${ts?.drawn ?? 0} N · ${ts?.lost ?? 0} D`} />
        <StatTile label="Buts marqués" value={ts?.gf ?? 0} color="#E04E00" sub={`${ts?.gf_avg ?? 0} / match`} />
        <StatTile label="Buts encaissés" value={ts?.ga ?? 0} color="#2a8fc4" sub={`${ts?.ga_avg ?? 0} / match`} />
      </div>
      <Tabs defaultValue="squad">
        <TabsList><TabsTrigger value="squad">Effectif</TabsTrigger><TabsTrigger value="results">Résultats</TabsTrigger><TabsTrigger value="stats">Statistiques</TabsTrigger></TabsList>
        <TabsContent value="squad">
          <div className="glass rounded-2xl p-2 sm:p-4">
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Joueur</TableHead><TableHead>Rôle</TableHead><TableHead className="text-center">MJ</TableHead><TableHead className="text-center">Buts</TableHead><TableHead className="text-center">Passes</TableHead><TableHead className="text-center">XP</TableHead></TableRow></TableHeader>
              <TableBody>
                {squad.map((p) => {
                  const s = xp.get(p.id)
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="num text-muted-foreground">{p.number}</TableCell>
                      <TableCell><Link to={`/joueurs/${p.id}`} className="flex items-center gap-2 hover:text-neon"><PlayerAvatar player={p} team={team} size={30} /><span className="font-semibold">{playerName(p)}</span></Link></TableCell>
                      <TableCell><RoleBadge long position={p.position} captain={p.is_captain || team?.captain_player_id === p.id} /></TableCell>
                      <TableCell className="num text-center">{s?.matches ?? 0}</TableCell>
                      <TableCell className="num text-center">{s?.goals ?? 0}</TableCell>
                      <TableCell className="num text-center">{s?.assists ?? 0}</TableCell>
                      <TableCell className="num text-center text-neon">{s?.xp ?? 0}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="results"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{matches.map((m) => <MatchCard key={m.id} match={m} />)}</div></TabsContent>
        <TabsContent value="stats">
          {timeline.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartBox title="Points cumulés">
                <ResponsiveContainer><LineChart data={timeline} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid {...GRID} /><XAxis dataKey="label" {...AXIS} /><YAxis {...AXIS} allowDecimals={false} />
                  <Tooltip {...TOOLTIP} formatter={(v) => [`${v} pts`, 'Points']} />
                  <Line type="monotone" dataKey="points" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 4, fill: SERIES[0], stroke: '#0A2556', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart></ResponsiveContainer>
              </ChartBox>
              <ChartBox title="Buts par match" legend={<Legend items={[{ label: 'Marqués', color: SERIES[0] }, { label: 'Encaissés', color: SERIES[1] }]} />}>
                <ResponsiveContainer><BarChart data={timeline} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={2}>
                  <CartesianGrid {...GRID} /><XAxis dataKey="label" {...AXIS} /><YAxis {...AXIS} allowDecimals={false} />
                  <Tooltip {...TOOLTIP} />
                  <Bar dataKey="gf" name="Marqués" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="ga" name="Encaissés" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart></ResponsiveContainer>
              </ChartBox>
            </div>
          ) : <EmptyState title="Pas encore de match joué" />}
        </TabsContent>
      </Tabs>
      <SectionTitle title="" className="hidden" />
    </div>
  )
}
