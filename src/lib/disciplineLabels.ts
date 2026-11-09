import type { Competition } from '@/types/entities'
/** Libellé court du filtre : Pré-saison (phase de sélection) / Gold Cup / Silver Cup / Tournoi */
export function phaseLabel(c: Pick<Competition, 'phase' | 'format' | 'name'>) {
  if (c.phase === 'league_phase' && c.format === 'swiss') return 'Pré-saison'
  if (c.phase === 'gold') return 'Gold Cup'
  if (c.phase === 'silver') return 'Silver Cup'
  if (c.phase === 'knockout' || c.phase === 'groups' || c.format === 'groups_knockout' || c.format === 'knockout') return 'Tournoi'
  return c.name
}
