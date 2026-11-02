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

export const POSITION_LABEL: Record<Position, string> = { GK: 'GB', DEF: 'DEF', MID: 'MIL', FWD: 'ATT' }
export const POSITION_LONG: Record<Position, string> = { GK: 'Gardien', DEF: 'Défenseur', MID: 'Milieu', FWD: 'Attaquant' }
export const POSITION_COLOR: Record<Position, string> = { GK: '#3b82f6', DEF: '#22c55e', MID: '#f97316', FWD: '#ef4444' }

export const STATUS_LABEL: Record<MatchStatus, string> = { scheduled: 'Programmé', live: 'En direct', finished: 'Terminé', postponed: 'Reporté', cancelled: 'Annulé' }

export const EVENT_LABEL: Record<EventType, string> = {
  goal: 'But', assist: 'Passe décisive', own_goal: 'But contre son camp', penalty_goal: 'Penalty marqué', penalty_missed: 'Penalty manqué',
  penalty_saved: 'Penalty arrêté', yellow_card: 'Carton jaune', red_card: 'Carton rouge', save: 'Arrêt', goal_conceded: 'But encaissé',
  substitution: 'Remplacement', goal_disallowed: 'But refusé', shootout_scored: 'TAB réussi', shootout_missed: 'TAB manqué', shootout_saved: 'TAB arrêté',
  shot_on_target: 'Tir cadré', shot_off_target: 'Tir non cadré', corner: 'Corner', throw_in: 'Touche', free_kick: 'Coup franc', foul: 'Faute', offside: 'Hors-jeu',
}

export const playerName = (p?: Player | null) => (p ? `${p.first_name} ${p.last_name}` : 'Joueur inconnu')
export const playerShort = (p?: Player | null) => (p ? `${p.first_name.charAt(0)}. ${p.last_name}` : '—')
export const initials = (p?: Player | null) => (p ? `${p.first_name[0] ?? ''}${p.last_name[0] ?? ''}`.toUpperCase() : '?')
export const ordinal = (n: number) => (n === 1 ? '1er' : `${n}e`)
