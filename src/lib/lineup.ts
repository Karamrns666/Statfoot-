// Compositions : 6 titulaires au maximum (6 contre 6).
import type { Lineup, MatchEvent } from '@/types/entities'
import { PLAYERS_ON_PITCH } from '@/config/rules'

/**
 * Ramène une composition à 6 titulaires : le gardien, puis les joueurs les plus impliqués dans le match
 * (buts, passes, arrêts, cartons…). Les autres passent remplaçants. Utile pour les matchs importés d'Excel,
 * où seuls les joueurs ayant une action sont connus. Renvoie la composition inchangée si elle est déjà conforme.
 */
export function capStarters<L extends Pick<Lineup, 'starter_ids' | 'substitute_ids' | 'goalkeeper_id' | 'match_id'>>(lineup: L, events: MatchEvent[]): L {
  const st = lineup.starter_ids ?? []
  if (st.length <= PLAYERS_ON_PITCH) return lineup
  const score = new Map<string, number>()
  for (const e of events) {
    if (e.match_id !== lineup.match_id) continue
    for (const id of [e.player_id, e.related_player_id]) if (id) score.set(id, (score.get(id) ?? 0) + 1)
  }
  const gk = lineup.goalkeeper_id && st.includes(lineup.goalkeeper_id) ? lineup.goalkeeper_id : undefined
  const field = st.filter((id) => id !== gk).map((id, i) => ({ id, i })).sort((a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0) || a.i - b.i).map((x) => x.id)
  const keep = new Set([...(gk ? [gk] : []), ...field].slice(0, PLAYERS_ON_PITCH))
  return {
    ...lineup,
    starter_ids: st.filter((id) => keep.has(id)),
    substitute_ids: [...st.filter((id) => !keep.has(id)), ...(lineup.substitute_ids ?? []).filter((id) => !keep.has(id))],
  }
}
