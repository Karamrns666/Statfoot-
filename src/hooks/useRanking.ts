// Classement d'une compétition, IDENTIQUE à celui de la page Classement (pré-saison : classement suisse avec le
// départage propre à la pré-saison ; MASTER / CHALLENGER : Art. 17.3). Utilisé par la page match, la fiche équipe et
// les cartes équipes pour qu'un même rang s'affiche partout. Avant le premier résultat : aucun rang (started = false).
import { useMemo } from 'react'
import { useData } from '@/hooks/useData'
import { isPreseasonComp, usePreseason } from '@/hooks/usePreseason'
import { competitionStandings } from '@/lib/stats'

export interface RankRow { team_id: string; rank: number; points: number; gd: number; played: number }

export function useCompetitionRanking(competitionId?: string | null) {
  const { db, league } = useData()
  const comp = db.Competition.find((c) => c.id === competitionId)
  const pre = usePreseason(isPreseasonComp(comp) ? comp!.season_id : null)
  return useMemo(() => {
    const rows: RankRow[] = !comp ? []
      : pre && pre.comp.id === comp.id ? pre.state.ranking.map((r) => ({ team_id: r.team_id, rank: r.rank, points: r.points, gd: r.diff, played: r.played }))
      : competitionStandings(league, comp.id).map((r) => ({ team_id: r.team_id, rank: r.rank, points: r.points, gd: r.gd, played: r.played }))
    const started = rows.some((r) => r.played > 0)
    return { rows, byTeam: new Map(rows.map((r) => [r.team_id, r])), started }
  }, [comp, pre, league])
}

/** « 3e · 7 pts · Diff. +4 » — « – » tant qu'aucun match n'est joué */
export function rankLabel(r: RankRow | undefined, started: boolean) {
  if (!r || !started) return '–'
  const pts = `${r.points} pt${Math.abs(r.points) > 1 ? 's' : ''}`
  return `${r.rank === 1 ? '1er' : `${r.rank}e`} · ${pts} · Diff. ${r.gd > 0 ? '+' : ''}${r.gd}`
}
export const RANK_PENDING = 'Classement disponible après les premiers résultats'
