import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { EventType, MatchStatus, Position, Player } from '@/types/entities'

export const fmtDate = (d?: string, f = 'EEE d MMM') => (d ? format(new Date(d), f, { locale: fr }) : '—')
export const fmtTime = (d?: string) => (d ? format(new Date(d), 'HH:mm') : '')
export const fmtDateTime = (d?: string) => (d ? format(new Date(d), "EEE d MMM yyyy 'à' HH:mm", { locale: fr }) : '—')
export const fmtRelativeDay = (d?: string) => {
  if (!d) return '—'
  const x = new Date(d)
  if (isToday(x)) return "Aujourd'hui"
  if (isTomorrow(x)) return 'Demain'
  if (isYesterday(x)) return 'Hier'
  return format(x, 'EEE d MMM', { locale: fr })
}
export const fmtAgo = (d?: string) => (d ? formatDistanceToNow(new Date(d), { locale: fr, addSuffix: true }) : '—')

/** 6 contre 6 : pas de postes. Seuls « Gardien » et « Capitaine » sont affichés. */
export const POSITION_LABEL: Record<Position, string> = { GK: 'GB', FIELD: '' }
export const POSITION_LONG: Record<Position, string> = { GK: 'Gardien', FIELD: 'Joueur' }
export const POSITION_COLOR: Record<Position, string> = { GK: '#3b82f6', FIELD: '#94a3b8' }
/** Normalise un poste hérité (DEF/MID/FWD, GB, Gardien…) vers GK / FIELD */
export const toRole = (v?: string | null): Position => (v && /^(gk|gb|g|gardien|goal(keeper)?)$/i.test(v.trim()) ? 'GK' : 'FIELD')
export const isKeeper = (p?: Pick<Player, 'position'> | null) => p?.position === 'GK'
/** Rôles affichés d'un joueur : Gardien et/ou Capitaine (rien pour un joueur de champ) */
export const roleLabels = (p?: Pick<Player, 'position' | 'is_captain'> | null, captain = p?.is_captain) =>
  [p?.position === 'GK' && 'Gardien', captain && 'Capitaine'].filter(Boolean) as string[]

export const STATUS_LABEL: Record<MatchStatus, string> = { scheduled: 'Programmé', live: 'En direct', finished: 'Terminé', postponed: 'Reporté', cancelled: 'Annulé' }

export const EVENT_LABEL: Record<EventType, string> = {
  goal: 'But', own_goal: 'But contre son camp', penalty_missed: 'Penalty manqué', goal_disallowed: 'But refusé',
  shot_on_target: 'Tir cadré', shot_off_target: 'Tir non cadré', save: 'Arrêt', penalty_saved: 'Penalty arrêté',
  corner: 'Corner', throw_in: 'Touche', free_kick: 'Coup franc', foul: 'Faute',
  yellow_card: 'Carton jaune', second_yellow: '2e jaune (rouge)', red_card: 'Carton rouge', substitution: 'Remplacement', gk_change: 'Changement de gardien',
  shootout_scored: 'TAB réussi', shootout_saved: 'TAB arrêté', shootout_missed: 'TAB manqué',
}

export const playerName = (p?: Player | null) => (p ? `${p.first_name} ${p.last_name}` : 'Joueur inconnu')
export const playerShort = (p?: Player | null) => (p ? `${p.first_name.charAt(0)}. ${p.last_name}` : '—')
/** Avatar rond centré sur le visage (centre détecté lors du détourage), sinon haut de la photo. */
export const faceStyle = (p?: Pick<Player, 'photo_face_x' | 'photo_face_y'> | null): { objectPosition: string; transform?: string; transformOrigin?: string } =>
  p?.photo_face_x != null && p.photo_face_y != null
    ? { objectPosition: `${p.photo_face_x}% ${p.photo_face_y}%`, transform: 'scale(1.7)', transformOrigin: `${p.photo_face_x}% ${p.photo_face_y}%` }
    : { objectPosition: '50% 18%' }
export const initials = (p?: Player | null) => (p ? `${p.first_name[0] ?? ''}${p.last_name[0] ?? ''}`.toUpperCase() : '?')
export const ordinal = (n: number) => (n === 1 ? '1er' : `${n}e`)
