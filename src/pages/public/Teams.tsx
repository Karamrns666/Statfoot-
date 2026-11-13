import { useData } from '@/hooks/useData'
import { useEffectiveSeason, useSeasonCompetitions } from '@/hooks/useStats'
import { PageHeader } from '@/components/league/Bits'
import { SeasonTeamCard } from '@/components/cards/TeamCard'
import { TierLegendCards } from '@/components/cards/TierLegend'

export default function Teams() {
  const { db } = useData()
  const season = useEffectiveSeason()
  const comps = useSeasonCompetitions()
  const teams = db.Team.filter((t) => comps.some((c) => c.team_ids?.includes(t.id))).sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div>
      <PageHeader title="Équipes" subtitle={`${teams.length} entreprises engagées · ${season?.name ?? ''}`} />
      <TierLegendCards />
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
        {teams.map((t) => <SeasonTeamCard key={t.id} team={t} />)}
      </div>
    </div>
  )
}
