import { useCallback, useMemo } from 'react'
import { useData } from './useData'
import { seniorityMap, type Seniority } from '@/lib/seniority'
import { isRookie } from '@/lib/xp'
import type { Player } from '@/types/entities'

/** Ancienneté (Platinum / Gold / Silver) de toutes les équipes, recalculée quand les données changent. */
export function useSeniorityMap(): Map<string, Seniority> {
  const { db } = useData()
  return useMemo(() => seniorityMap(db.Team, db.Competition, db.Season, db.Club ?? []), [db.Team, db.Competition, db.Season, db.Club])
}
export function useTeamSeniority(teamId?: string) {
  return useSeniorityMap().get(teamId ?? '')
}

/** « Recrue » : coché dans l'admin, ou sans historique approuvé ET dans une équipe nouvelle (voir isRookie) */
export function useRookie() {
  const map = useSeniorityMap()
  return useCallback((p: Pick<Player, 'season_ids' | 'rookie' | 'link' | 'team_id'>) => isRookie(p, map.get(p.team_id)?.seasons), [map])
}
