import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClubHistory } from '@/components/league/ClubHistory'
import { SuspendedBadge } from '@/components/reglement/PlayerDisciplineCard'
import { useSeasonDiscipline } from '@/hooks/useDiscipline'
import { useEffectiveSeason } from '@/hooks/useStats'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { usePlayerXP, useTeamStats, useSeasonCompetitions } from '@/hooks/useStats'
import { CompetitionBadge, EmptyState, FormPills, SectionTitle, StatTile } from '@/components/league/Bits'
import { PlayerAvatar, RoleBadge } from '@/components/league/Identity'
import { TeamBanner } from '@/components/league/TeamBanner'
import { MatchCard } from '@/components/match/MatchCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SortableTable } from '@/components/league/SortableTable'
import { shotColumns } from '@/components/league/shotColumns'
import type { Player } from '@/types/entities'
import { AXIS, ChartBox, GRID, Legend, SERIES, TOOLTIP } from '@/components/charts/theme'
import { competitionStandings, teamForm } from '@/lib/stats'
import { playerName } from '@/lib/format'
import { fmtAccuracy, fmtShots, fmtShotsPerGoal } from '@/lib/shots'

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
  const effSeason = useEffectiveSeason()
  const discipline = useSeasonDiscipline(scopeSeasonId ?? effSeason?.id)
  const suspended = useMemo(() => { const m = new Map<string, number>(); for (const c of discipline) for (const d of c.players.values()) if (d.remaining > 0) m.set(d.player_id, (m.get(d.player_id) ?? 0) + d.remaining); return m }, [discipline])
  const squad = useMemo(() => db.Player.filter((p) => p.team_id === id && (!scopeSeasonId || p.season_ids?.includes(scopeSeasonId))).sort((a, b) => (POS_ORDER[a.position] ?? 1) - (POS_ORDER[b.position] ?? 1) || (a.number ?? 0) - (b.number ?? 0)), [db.Player, id, scopeSeasonId])
  const matches = db.Match.filter((m) => (m.home_team_id === id || m.away_team_id === id) && (!scopeSeasonId || m.season_id === scopeSeasonId)).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  if (!team) return <EmptyState title="Équipe introuvable" />
  const cup = comps.find((c) => (c.phase === 'gold' || c.phase === 'silver') && c.team_ids?.includes(team.id)) ?? comps.find((c) => c.team_ids?.includes(team.id))
  const row = cup ? competitionStandings(league, cup.id).find((r) => r.team_id === team.id) : undefined
  const timeline = ts?.timeline ?? []
  return (
    <div className="space-y-8">
      <TeamBanner team={team}>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/85">
          {team.company_logo_url && <img src={team.company_logo_url} alt={team.company ?? ''} className={team.company_logo_url.startsWith('/logos/') ? 'h-9 w-auto rounded-lg bg-white' : 'size-6 rounded'} />}<span>{team.company}</span><CompetitionBadge competition={cup} />{row && <span className="font-semibold">{row.rank}e · {row.points} pts</span>}
        </div>
        <div className="mt-3"><FormPills form={teamForm(matches, team.id)} size="md" /></div>
        <ClubHistory team={team} />
      </TeamBanner>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile label="Matchs joués" value={ts?.played ?? 0} sub={`${ts?.won ?? 0}V · ${ts?.drawn ?? 0}N · ${ts?.lost ?? 0}D`} />
        <StatTile label="Buts marqués" value={ts?.gf ?? 0} color="#E04E00" sub={`${ts?.gf_avg ?? 0} / match`} />
        <StatTile label="Buts encaissés" value={ts?.ga ?? 0} color="#2a8fc4" sub={`${ts?.ga_avg ?? 0} / match`} />
      </div>
      <Tabs defaultValue="squad">
        <TabsList><TabsTrigger value="squad">Effectif</TabsTrigger><TabsTrigger value="results">Résultats</TabsTrigger><TabsTrigger value="stats">Statistiques</TabsTrigger></TabsList>
        <TabsContent value="squad">
          <div className="glass rounded-2xl p-2 sm:p-4">
            <SortableTable rows={squad} rowKey={(p) => p.id} initial={{ key: 'role', dir: 'asc' }} columns={[
              { key: 'number', label: '#', first: 'asc', className: 'num text-muted-foreground', sort: (p) => p.number, render: (p) => p.number },
              { key: 'name', label: 'Joueur', sort: (p) => playerName(p), render: (p) => <Link to={`/joueurs/${p.id}`} className="flex items-center gap-2 hover:text-neon"><PlayerAvatar player={p} team={team} size={30} /><span className="font-semibold">{playerName(p)}</span><SuspendedBadge remaining={suspended.get(p.id) ?? 0} /></Link> },
              { key: 'role', label: 'Rôle', first: 'asc', sort: (p) => (p.position === 'GK' ? 0 : p.is_captain || team?.captain_player_id === p.id ? 1 : 2), render: (p) => <RoleBadge long position={p.position} captain={p.is_captain || team?.captain_player_id === p.id} /> },
              { key: 'mj', label: 'MJ', title: 'Matchs joués', headClassName: 'text-center', className: 'num text-center', sort: (p) => xp.get(p.id)?.matches ?? 0, render: (p) => xp.get(p.id)?.matches ?? 0 },
              { key: 'goals', label: 'Buts', headClassName: 'text-center', className: 'num text-center', sort: (p) => xp.get(p.id)?.goals ?? 0, render: (p) => xp.get(p.id)?.goals ?? 0 },
              { key: 'assists', label: 'Passes', headClassName: 'text-center', className: 'num text-center', sort: (p) => xp.get(p.id)?.assists ?? 0, render: (p) => xp.get(p.id)?.assists ?? 0 },
              ...shotColumns<Player>((p) => xp.get(p.id)?.shot, 'hidden md:table-cell'),
              { key: 'xp', label: 'XP', headClassName: 'text-center', className: 'num text-center text-neon', sort: (p) => xp.get(p.id)?.xp ?? 0, render: (p) => xp.get(p.id)?.xp ?? 0 },
            ]} />
          </div>
        </TabsContent>
        <TabsContent value="results"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{matches.map((m) => <MatchCard key={m.id} match={m} />)}</div></TabsContent>
        <TabsContent value="stats">
          {timeline.length ? (<>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <StatTile label="Tirs" value={fmtShots(ts?.shot, 'shots')} sub={ts?.shot.matches ? `${ts.shot.matches} match(s) saisis` : 'non saisis'} />
              <StatTile label="Tirs cadrés" value={fmtShots(ts?.shot, 'on_target')} color="#2a8fc4" />
              <StatTile label="Précision" value={fmtAccuracy(ts?.shot)} color="#22c55e" sub="cadrés / tirs" />
              <StatTile label="Tirs par but" value={fmtShotsPerGoal(ts?.shot)} color="#E04E00" />
            </div>
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
          </>) : <EmptyState title="Pas encore de match joué" />}
        </TabsContent>
      </Tabs>
      <SectionTitle title="" className="hidden" />
    </div>
  )
}
