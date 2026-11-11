import { useMemo } from 'react'
import { useData } from './useData'
import { seniorityMap, type Seniority } from '@/lib/seniority'

/** Ancienneté (Platinum / Gold / Silver) de toutes les équipes, recalculée quand les données changent. */
export function useSeniorityMap(): Map<string, Seniority> {
  const { db } = useData()
  return useMemo(() => seniorityMap(db.Team, db.Competition, db.Season, db.Club ?? []), [db.Team, db.Competition, db.Season, db.Club])
}
export function useTeamSeniority(teamId?: string) {
  return useSeniorityMap().get(teamId ?? '')
}
