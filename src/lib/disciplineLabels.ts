import { competitionNames, phaseName } from '@/lib/competitionNames'
import type { Competition } from '@/types/entities'
/** Libellé court du filtre : Pré-saison (phase de sélection) / Gold Cup / Silver Cup / Tournoi */
export function phaseLabel(c: Pick<Competition, 'phase' | 'format' | 'name'>) {
  if (c.phase === 'league_phase' && c.format === 'swiss') return competitionNames().league_phase
  if (c.phase === 'gold') return phaseName('gold')
  if (c.phase === 'silver') return phaseName('silver')
  if (c.phase === 'knockout' || c.phase === 'groups' || c.format === 'groups_knockout' || c.format === 'knockout') return 'Tournoi'
  return c.name
}
