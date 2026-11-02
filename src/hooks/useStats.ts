import { useMemo } from 'react'
import { useData } from './useData'
import { useSeason } from './useSeason'
import { computePlayerXP, computeTeamStats, raceWithEvolution, type RaceKey, type XPScope } from '@/lib/stats'

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
const k = (s: object) => JSON.stringify(s)
/** XP + stats joueurs — LA source unique (fiche joueur, trophées, accueil, admin) */
export function usePlayerXP(scope: XPScope) {
  const { league } = useData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => computePlayerXP(league, scope), [league, k(scope)])
}
export function useRace(scope: XPScope, key: RaceKey) {
  const { league } = useData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => raceWithEvolution(league, scope, key), [league, k(scope), key])
}
export function useTeamStats(scope: XPScope) {
  const { league } = useData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => computeTeamStats(league, scope), [league, k(scope)])
}
