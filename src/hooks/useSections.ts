// « Prix de la Ligue » (Pré-saison, MASTER, CHALLENGER) et « Prix du Tournoi » : périmètres des courses, stats,
// meilleures performances et palmarès.
//  • Pré-saison : matchs de la pré-saison.
//  • MASTER / CHALLENGER : stats joueurs et équipes = pré-saison + division (les stats de la pré-saison comptent),
//    pour les équipes de la division ; le CLASSEMENT par points repart de zéro (matchs de la division seulement).
//  • Tournoi : compétition à part (phase « knockout »), jamais mêlée à la ligue ; pas créée automatiquement.
import { useMemo } from 'react'
import { useData } from './useData'
import { competitionNames, phaseName } from '@/lib/competitionNames'
import type { Award, Competition } from '@/types/entities'
import type { XPScope } from '@/lib/xp'

export type SectionKey = 'preseason' | 'master' | 'challenger' | 'tournament'
export interface Section {
  key: SectionKey
  label: string
  /** phrase expliquant le périmètre */
  note: string
  /** compétitions dont les matchs comptent pour les stats joueurs / équipes */
  comps: Competition[]
  /** compétition du classement par points (repart de zéro pour MASTER / CHALLENGER) */
  standing?: Competition
  scope: XPScope
  awardScope: NonNullable<Award['scope']>
  available: boolean
}

export function useSections(seasonId: string | null) {
  const { db } = useData()
  return useMemo(() => {
    const comps = db.Competition.filter((c) => c.season_id === seasonId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const pre = comps.find((c) => c.phase === 'league_phase')
    const div = (ph: 'gold' | 'silver') => comps.filter((c) => c.phase === ph)
    const mk = (key: 'master' | 'challenger', ph: 'gold' | 'silver'): Section => {
      const d = div(ph), teams = [...new Set(d.flatMap((c) => c.team_ids ?? []))]
      return {
        key, label: phaseName(ph), awardScope: ph, available: d.length > 0, comps: [...(pre ? [pre] : []), ...d], standing: d[0],
        scope: { seasonId, competitionIds: [...(pre ? [pre.id] : []), ...d.map((c) => c.id)], teamIds: teams },
        note: `${phaseName(ph)} : stats de la ${competitionNames().league_phase.toLowerCase()} incluses · le classement par points repart de zéro`,
      }
    }
    const tour = comps.filter((c) => c.phase === 'knockout')
    const sections: Record<SectionKey, Section> = {
      preseason: { key: 'preseason', label: pre?.name ?? competitionNames().league_phase, awardScope: 'league_phase', available: !!pre, comps: pre ? [pre] : [], standing: pre, scope: { seasonId, competitionIds: pre ? [pre.id] : [] }, note: 'Matchs de la pré-saison uniquement' },
      master: mk('master', 'gold'),
      challenger: mk('challenger', 'silver'),
      tournament: { key: 'tournament', label: tour[0]?.name ?? 'Tournoi', awardScope: 'tournament', available: tour.length > 0, comps: tour, standing: tour[0], scope: { seasonId, competitionIds: tour.map((c) => c.id) }, note: 'Compétition à part : ses matchs ne comptent pas pour la ligue' },
    }
    return sections
  }, [db.Competition, seasonId])
}
