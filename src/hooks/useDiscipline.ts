// Discipline d'une saison (règlement v8) : cartons pour information, suspensions issues des décisions du conseil de
// discipline (Art. 19) — ou saisies à la main sur les anciennes saisons. Aucun cumul, aucune suspension automatique.
import { useMemo } from 'react'
import { useData } from './useData'
import { computeDiscipline, rulesForSeason, suspendedFor, type DisciplineData, type PlayerDiscipline } from '@/lib/reglement'
import type { Match } from '@/types/entities'
import { disciplineFromDb } from '@/lib/leagueData'

export function useDisciplineData(): DisciplineData {
  const { db } = useData()
  return useMemo(() => disciplineFromDb(db), [db.Match, db.MatchEvent, db.Lineup, db.Player, db.Suspension])
}

export function useSeasonRules(seasonId?: string | null) {
  const { db } = useData()
  return rulesForSeason(db.Season.find((s) => s.id === seasonId))
}

/** Discipline de toute la saison (joueur → cartons, suspensions, matchs restants, alignements interdits). */
export function useSeasonDiscipline(seasonId?: string | null): Map<string, PlayerDiscipline> {
  const data = useDisciplineData()
  return useMemo(() => (seasonId ? computeDiscipline(seasonId, data).players : new Map()), [data, seasonId])
}

/** Joueurs suspendus pour un match (bloqués à la feuille de match). */
export function useSuspendedFor(match?: Match): Map<string, { remaining: number; label: string; discipline?: PlayerDiscipline }> {
  const data = useDisciplineData()
  return useMemo(() => {
    const out = new Map<string, { remaining: number; label: string; discipline?: PlayerDiscipline }>()
    if (!match) return out
    for (const [pid, d] of suspendedFor(match, data)) out.set(pid, { remaining: d.remaining, label: suspensionLabel(d.remaining), discipline: d })
    return out
  }, [match, data])
}

export const suspensionLabel = (n: number) => `Suspendu (${n} match${n > 1 ? 's' : ''} restant${n > 1 ? 's' : ''})`

/** Discipline d'un joueur sur la saison. */
export function usePlayerDiscipline(playerId?: string, seasonId?: string | null) {
  const all = useSeasonDiscipline(seasonId)
  return useMemo(() => (playerId ? all.get(playerId) : undefined), [all, playerId])
}
