// Détourage des photos joueurs : règles communes à la file automatique, au traitement en lot et au formulaire.
import type { Player } from '@/types/entities'

export const MAX_CUTOUT_TRIES = 3

type P = Pick<Player, 'photo_url' | 'photo_cutout_url' | 'photo_cutout_source' | 'photo_cutout_tries' | 'photo_cutout_disabled'>

/** La version détourée correspond-elle à la photo actuelle ? */
export const hasCurrentCutout = (p: P) => !!p.photo_url && !!p.photo_cutout_url && (!p.photo_cutout_source || p.photo_cutout_source === p.photo_url)

/** Ce joueur a-t-il besoin d'un détourage automatique ? (fonction pure) */
export function needsCutout(p: P, ignoreTries = false) {
  if (!p.photo_url || p.photo_cutout_disabled) return false
  if (hasCurrentCutout(p)) return false
  const stale = !!p.photo_cutout_source && p.photo_cutout_source !== p.photo_url
  return ignoreTries || stale || (p.photo_cutout_tries ?? 0) < MAX_CUTOUT_TRIES
}

/** Pause de la file automatique pendant un traitement en lot lancé à la main. */
let paused = false
export const pauseAutoCutouts = (v: boolean) => { paused = v }
export const autoCutoutsPaused = () => paused
