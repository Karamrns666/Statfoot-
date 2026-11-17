// Qui est sur le terrain ? Rejoue les événements d'une équipe : titulaires au coup d'envoi, puis chaque
// remplacement échange un joueur du terrain et un joueur du banc. Remplacements ILLIMITÉS (Art. 2.4) : un joueur
// sorti retourne sur le banc et peut revenir autant de fois que nécessaire. Seule exception : un joueur EXPULSÉ
// (rouge ou 2e jaune) ne revient plus (Art. 2.7). 6 joueurs au plus sur le terrain, dont 1 gardien.
import type { Lineup, MatchEvent } from '@/types/entities'
import { sortEvents } from './matchEngine'

export const MAX_ON_FIELD = 6

type LU = Pick<Lineup, 'starter_ids' | 'substitute_ids' | 'present_ids' | 'goalkeeper_id'> | undefined

export interface PitchState {
  /** joueurs de la feuille de match, dans l'ordre de la feuille */
  roster: string[]
  onField: string[]
  bench: string[]
  expelled: Set<string>
  goalkeeper?: string
}

const isExpulsion = (e: MatchEvent) => (e.type === 'red_card' || e.type === 'second_yellow') && !!e.player_id && e.card_target !== 'official'

/** Événements de l'équipe jusqu'à `until` compris (tous si absent), dans l'ordre du match */
function teamEvents(events: MatchEvent[], teamId: string, until?: MatchEvent) {
  const list = sortEvents(events.filter((e) => e.team_id === teamId))
  if (!until) return list
  const i = list.findIndex((e) => e.id === until.id)
  return i < 0 ? list : list.slice(0, i + 1)
}

export function rosterOf(lu: LU, events: MatchEvent[], teamId: string): string[] {
  const ids: string[] = [...(lu?.present_ids ?? []), ...(lu?.starter_ids ?? []), ...(lu?.substitute_ids ?? [])]
  for (const e of events) if (e.team_id === teamId && (e.type === 'substitution' || e.type === 'gk_change')) ids.push(...[e.player_id, e.related_player_id].filter(Boolean) as string[])
  return [...new Set(ids)]
}

/** État terrain / banc de l'équipe après tous les événements (ou après `until`). */
export function pitchState(lu: LU, events: MatchEvent[], teamId: string, until?: MatchEvent): PitchState {
  const roster = rosterOf(lu, events, teamId)
  const on = new Set(lu?.starter_ids ?? [])
  const expelled = new Set<string>()
  let gk = lu?.goalkeeper_id
  for (const e of teamEvents(events, teamId, until)) {
    if (e.type === 'substitution') {
      if (e.related_player_id) on.delete(e.related_player_id)
      if (e.player_id && !expelled.has(e.player_id)) on.add(e.player_id)
      if (e.related_player_id && e.related_player_id === gk && e.player_id) gk = undefined
    } else if (e.type === 'gk_change' && e.player_id) {
      // nouveau gardien : s'il était sur le banc, il entre à la place de l'ancien gardien
      if (!on.has(e.player_id) && !expelled.has(e.player_id)) { if (gk) on.delete(gk); on.add(e.player_id) }
      gk = e.player_id
    } else if (isExpulsion(e)) {
      expelled.add(e.player_id!)
      on.delete(e.player_id!)
    }
  }
  const order = (ids: Iterable<string>) => roster.filter((id) => new Set(ids).has(id)).concat([...ids].filter((id) => !roster.includes(id)))
  const onField = order(on)
  return { roster: [...new Set([...roster, ...onField])], onField, bench: roster.filter((id) => !on.has(id)), expelled, goalkeeper: gk && on.has(gk) ? gk : undefined }
}

export const isOnField = (st: PitchState, pid: string) => st.onField.includes(pid)
export const canEnter = (st: PitchState, pid: string) => !st.onField.includes(pid) && !st.expelled.has(pid)
/** Un joueur peut-il entrer sans que personne ne sorte ? (équipe à moins de 6) */
export const roomOnField = (st: PitchState) => st.onField.length < MAX_ON_FIELD

/** Périodes de jeu de chaque joueur [entrée, sortie[ en minutes de match (1 à 40, prolongations au-delà). */
export function stints(lu: LU, events: MatchEvent[], teamId: string, total: number): Map<string, [number, number][]> {
  const res = new Map<string, [number, number][]>()
  const open = new Map<string, number>()
  const start = (id: string, t: number) => { if (!open.has(id)) open.set(id, t) }
  const stop = (id: string, t: number) => { const s = open.get(id); if (s === undefined) return; open.delete(id); if (t > s) res.set(id, [...(res.get(id) ?? []), [s, t]]); else if (!res.has(id)) res.set(id, []) }
  for (const id of lu?.starter_ids ?? []) start(id, 0)
  const expelled = new Set<string>()
  let gk = lu?.goalkeeper_id
  for (const e of sortEvents(events.filter((x) => x.team_id === teamId))) {
    const t = Math.min(total, Math.max(0, (e.minute ?? 0) + (e.added_minute ? 0 : 0)))
    if (e.type === 'substitution') {
      if (e.related_player_id) stop(e.related_player_id, t)
      if (e.player_id && !expelled.has(e.player_id)) start(e.player_id, t)
    } else if (e.type === 'gk_change' && e.player_id) {
      if (!open.has(e.player_id) && !expelled.has(e.player_id)) { if (gk) stop(gk, t); start(e.player_id, t) }
      gk = e.player_id
    } else if (isExpulsion(e)) { expelled.add(e.player_id!); stop(e.player_id!, t) }
  }
  for (const id of [...open.keys()]) stop(id, total)
  for (const id of lu?.starter_ids ?? []) if (!res.has(id)) res.set(id, [])
  return res
}

/** Minutes jouées (somme de toutes les entrées / sorties). */
export function minutesFromStints(s: Map<string, [number, number][]>): Map<string, number> {
  const out = new Map<string, number>()
  for (const [id, list] of s) out.set(id, list.reduce((a, [x, y]) => a + (y - x), 0))
  return out
}

/** Actions de jeu : un joueur choisi sur le banc doit d'abord entrer (la saisie n'est jamais bloquée, on propose l'entrée).
 *  Les cartons, eux, peuvent viser un remplaçant sans le faire entrer (Art. 2.5). */
const GAME_ACTIONS = new Set(['goal', 'assist', 'shot_on_target', 'shot_off_target', 'save', 'penalty_missed', 'penalty_saved', 'goal_disallowed'])
export function needsEntry(action: string, st: PitchState, pid: string) {
  return GAME_ACTIONS.has(action) && !st.onField.includes(pid) && !st.expelled.has(pid)
}
