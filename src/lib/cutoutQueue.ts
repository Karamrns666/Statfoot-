// File de détourage automatique : chaque joueur qui a une photo sans version détourée est traité
// en arrière-plan dans l'admin, un par un. 3 essais au plus par photo ; si la photo change, on recommence.
import type { Player } from '@/types/entities'

export const MAX_CUTOUT_TRIES = 3

/** Ce joueur a-t-il besoin d'un détourage automatique ? (fonction pure) */
export function needsCutout(p: Pick<Player, 'photo_url' | 'photo_cutout_url' | 'photo_cutout_source' | 'photo_cutout_tries'>) {
  if (!p.photo_url) return false
  const stale = !!p.photo_cutout_source && p.photo_cutout_source !== p.photo_url
  if (p.photo_cutout_url && !stale) return false
  return (p.photo_cutout_tries ?? 0) < MAX_CUTOUT_TRIES || stale
}
