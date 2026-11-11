import { Link } from 'react-router-dom'
import { useData } from '@/hooks/useData'
import { useEffectiveSeason, useSeasonCompetitions } from '@/hooks/useStats'
import { PageHeader, CompetitionBadge } from '@/components/league/Bits'
import { TeamLogo } from '@/components/league/Identity'
import { competitionStandings } from '@/lib/stats'
import { SeniorityBadge, SeniorityLegend } from '@/components/league/SeniorityBadge'

export default function Teams() {
  const { db, league } = useData()
  const season = useEffectiveSeason()
  const comps = useSeasonCompetitions()
  const cupOf = (tid: string) => comps.find((c) => (c.phase === 'gold' || c.phase === 'silver') && c.team_ids?.includes(tid)) ?? comps.find((c) => c.team_ids?.includes(tid))
  const teams = db.Team.filter((t) => comps.some((c) => c.team_ids?.includes(t.id))).sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div>
      <PageHeader title="Équipes" subtitle={`${teams.length} entreprises engagées · ${season?.name ?? ''}`} />
      <SeniorityLegend className="mb-4" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {teams.map((t) => {
          const c = cupOf(t.id)
          const row = c ? competitionStandings(league, c.id).find((r) => r.team_id === t.id) : undefined
          return (
            <Link key={t.id} to={`/equipes/${t.id}`} className="glass group relative overflow-hidden rounded-2xl p-4 text-center transition hover:-translate-y-1">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: t.primary_color }} />
              <SeniorityBadge teamId={t.id} size="xs" className="absolute right-2 top-2.5" />
              <TeamLogo team={t} size={72} className="mx-auto transition group-hover:scale-105" />
              <div className="title-caps mt-3 truncate text-lg">{t.name}</div>
              <div className="truncate text-xs text-muted-foreground">{t.company}</div>
              <div className="mt-3 flex items-center justify-center gap-2"><CompetitionBadge competition={c} />{row && <span className="text-xs text-muted-foreground">{row.rank}e · {row.points} pts</span>}</div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
