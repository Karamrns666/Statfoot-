// Terrains et fuseau horaire des matchs. Liste FIXE : pas de saisie libre de terrain dans l'admin.
export const PITCHES = ['Terrain 1', 'Terrain 2'] as const
export type Pitch = (typeof PITCHES)[number]
/** Nombre maximum de matchs sur un même créneau (= nombre de terrains). */
export const MAX_PER_SLOT = PITCHES.length
/** Les horaires sont ceux du Maroc, quel que soit le fuseau de l'appareil qui affiche le site. */
export const MATCH_TZ = 'Africa/Casablanca'
/** Créneaux proposés par défaut dans le planning (heure du Maroc). */
export const DEFAULT_SLOTS = ['20:00', '21:00', '22:00']
