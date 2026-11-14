// Forfaits : motif officiel obligatoire, choisi dans une liste fermée, avec l'article du règlement.
// Affiché partout où le match apparaît (match centre, fiche du match, résultats, TV, visuels réseaux).
import type { Match } from '@/types/entities'

export type ForfeitReason = '14.1' | '14.2' | '18.1' | '2.7' | '2.3_unregistered' | '2.3_not_employee' | 'other'
export const FORFEIT_REASONS: { key: ForfeitReason; label: string; short: string; art?: string }[] = [
  { key: '14.1', label: 'Non-présentation de l’équipe', short: 'Non-présentation', art: '14.1' },
  { key: '14.2', label: 'Effectif sous le minimum en cours de match', short: 'Effectif insuffisant', art: '14.2' },
  { key: '18.1', label: 'Abandon du match', short: 'Abandon du match', art: '18.1' },
  { key: '2.7', label: 'Joueur expulsé ou suspendu aligné', short: 'Joueur suspendu aligné', art: '2.7' },
  { key: '2.3_unregistered', label: 'Joueur non inscrit aligné', short: 'Joueur non inscrit', art: '2.3' },
  { key: '2.3_not_employee', label: 'Joueur non salarié de l’entreprise (réserve confirmée)', short: 'Joueur non salarié', art: '2.3' },
  { key: 'other', label: 'Autre décision d’Ardentia', short: 'Décision Ardentia' },
]
export const forfeitReason = (k?: string) => FORFEIT_REASONS.find((r) => r.key === k)

export const isForfeitMatch = (m: Pick<Match, 'forfeit_team_id' | 'home_team_id' | 'away_team_id'>) => !!m.forfeit_team_id && (m.forfeit_team_id === m.home_team_id || m.forfeit_team_id === m.away_team_id)

/** « FORFAIT — Joueur non salarié (Art. 2.3) » */
export function forfeitText(m: Pick<Match, 'forfeit_team_id' | 'home_team_id' | 'away_team_id' | 'forfeit_reason' | 'forfeit_note'>, upper = false) {
  if (!isForfeitMatch(m)) return ''
  const r = forfeitReason(m.forfeit_reason)
  const txt = r ? `${r.short}${r.art ? ` (Art. ${r.art})` : ''}` : m.forfeit_note || ''
  const out = `Forfait${txt ? ` — ${txt}` : ''}`
  return upper ? out.toLocaleUpperCase('fr-FR') : out
}

/** Issues d'une réserve (Art. 17.4) */
export type ReserveOutcome = 'pending' | 'rejected' | 'confirmed_not_employee' | 'confirmed_unregistered'
export const RESERVE_OUTCOMES: { key: ReserveOutcome; label: string; forfeit?: ForfeitReason }[] = [
  { key: 'pending', label: 'Réserve déposée — en attente de décision' },
  { key: 'rejected', label: 'Réserve rejetée — résultat du terrain maintenu' },
  { key: 'confirmed_not_employee', label: 'Réserve confirmée — joueur non salarié → défaite 3-0', forfeit: '2.3_not_employee' },
  { key: 'confirmed_unregistered', label: 'Réserve confirmée — joueur non inscrit → défaite 3-0', forfeit: '2.3_unregistered' },
]
