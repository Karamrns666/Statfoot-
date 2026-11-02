import { useMemo } from 'react'
import { useData } from './useData'
import { useSeason } from './useSeason'
import { computePlayerStats, computeTeamStats, type Scope } from '@/lib/stats'

/** Saison "effective" : la saison sélectionnée, ou la saison active si "Toutes saisons". */
export function useEffectiveSeason() {
  const { seasons, season } = useSeason()
  return season ?? seasons.find((s) => s.is_active) ?? seasons[0] ?? null
}

export function useSeasonCompetitions(seasonId?: string | null) {
  const { db } = useData()
  const eff = useEffectiveSeason()
  const sid = seasonId ?? eff?.id
  return useMemo(() => db.Competition.filter((c) => c.season_id === sid).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [db.Competition, sid])
}

const key = (s: Scope) => JSON.stringify(s)
export function usePlayerStats(scope: Scope) {
  const { league } = useData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => computePlayerStats(league, scope), [league, key(scope)])
}
export function useTeamStats(scope: Scope) {
  const { league } = useData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => computeTeamStats(league, scope), [league, key(scope)])
}
