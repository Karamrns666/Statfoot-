// Tirs : calculs partagés (stats joueurs, stats équipes, Match Center, feuille de match).
//  · Un but est toujours un tir cadré.
//  · Tir cadré = but + tir cadré saisi ; tir = tir cadré + tir non cadré + penalty manqué.
//  · Un match ne compte dans les tirs que si les tirs y ont été saisis (sinon « – », pas de 0 trompeur).
//  · Précision = tirs cadrés / tirs ; tirs par but = tirs / buts. Pas de division par zéro : « – ».
import type { Match, MatchEvent, MatchTeamStats } from '@/types/entities'

export interface ShotTotals {
  shots: number
  on_target: number
  /** buts marqués dans les matchs où les tirs ont été saisis (dénominateur de « tirs par but ») */
  goals: number
  /** matchs avec tirs saisis */
  matches: number
}
export const emptyShots = (): ShotTotals => ({ shots: 0, on_target: 0, goals: 0, matches: 0 })
export const addShots = (a: ShotTotals, b: ShotTotals): ShotTotals => ({ shots: a.shots + b.shots, on_target: a.on_target + b.on_target, goals: a.goals + b.goals, matches: a.matches + b.matches })

/** Tir saisi à la main (les tirs cadrés automatiques d'un but ou d'un arrêt ne comptent pas comme saisie). */
const isManualShot = (e: MatchEvent) => (e.type === 'shot_on_target' && !e.auto) || e.type === 'shot_off_target' || e.type === 'penalty_missed'

/** Tirs par joueur d'une équipe sur un match, ou null si aucun tir n'a été saisi par joueur. */
export function playerMatchShots(events: MatchEvent[], teamId: string): Map<string, ShotTotals> | null {
  const mine = events.filter((e) => e.team_id === teamId && e.period !== 'PENS')
  if (!mine.some((e) => isManualShot(e) && e.player_id && e.type !== 'penalty_missed')) return null
  const out = new Map<string, ShotTotals>()
  const get = (pid: string) => { if (!out.has(pid)) out.set(pid, { ...emptyShots(), matches: 1 }); return out.get(pid)! }
  for (const e of mine) {
    if (!e.player_id) continue
    if (e.type === 'goal') { const s = get(e.player_id); s.shots++; s.on_target++; s.goals++ }
    else if (e.type === 'shot_on_target' && !e.auto) { const s = get(e.player_id); s.shots++; s.on_target++ }
    else if (e.type === 'shot_off_target' || e.type === 'penalty_missed') get(e.player_id).shots++
  }
  return out
}

/**
 * Tirs d'une équipe sur un match, ou null si non saisis.
 * Priorité aux chiffres de la feuille de match (saisie manuelle), sinon calcul depuis les actions du Match Center :
 * tirs cadrés = buts + tirs cadrés saisis + arrêts du gardien adverse.
 */
export function teamMatchShots(m: Pick<Match, 'id' | 'home_team_id' | 'away_team_id' | 'home_score' | 'away_score'>, events: MatchEvent[], teamId: string, sheet?: Pick<MatchTeamStats, 'shots' | 'shots_on_target'>): ShotTotals | null {
  const mine = events.filter((e) => e.team_id === teamId && e.period !== 'PENS')
  const goals = mine.filter((e) => e.type === 'goal').length || (teamId === m.home_team_id ? m.home_score : m.away_score) || 0
  if (sheet?.shots != null) {
    const on = Math.min(sheet.shots, Math.max(sheet.shots_on_target ?? 0, 0))
    return { shots: Math.max(sheet.shots, on), on_target: on, goals, matches: 1 }
  }
  if (!mine.some(isManualShot)) return null
  const live = teamLiveShots(events, teamId, m)
  return { shots: live.shots, on_target: live.on_target, goals, matches: 1 }
}

/** Tirs d'une équipe depuis les actions (sans condition de saisie) — utilisé en direct par le Match Center. */
export function teamLiveShots(events: MatchEvent[], teamId: string, m: Pick<Match, 'home_team_id' | 'away_team_id'>) {
  const opp = teamId === m.home_team_id ? m.away_team_id : m.home_team_id
  let on = 0, off = 0
  for (const e of events) {
    if (e.period === 'PENS') continue
    if (e.team_id === teamId) {
      if (e.type === 'goal' || (e.type === 'shot_on_target' && !e.auto)) on++
      else if (e.type === 'shot_off_target' || e.type === 'penalty_missed') off++
    } else if (e.team_id === opp && (e.type === 'save' || e.type === 'penalty_saved')) on++ // arrêt adverse = tir cadré
  }
  return { shots: on + off, on_target: on, shots_off_target: off }
}

/** Précision en % (entier) ou null si aucun tir. */
export const shotAccuracy = (s: Pick<ShotTotals, 'shots' | 'on_target'> | null | undefined) => (s && s.shots > 0 ? Math.round((s.on_target / s.shots) * 100) : null)
/** Tirs par but (1 décimale) ou null si aucun but. */
export const shotsPerGoal = (s: Pick<ShotTotals, 'shots' | 'goals'> | null | undefined) => (s && s.goals > 0 && s.shots > 0 ? Math.round((s.shots / s.goals) * 10) / 10 : null)

export const DASH = '–'
export const fmtShots = (s: ShotTotals | null | undefined, k: 'shots' | 'on_target') => (s && s.matches > 0 ? String(s[k]) : DASH)
export const fmtAccuracy = (s: ShotTotals | null | undefined) => { const v = s && s.matches > 0 ? shotAccuracy(s) : null; return v == null ? DASH : `${v} %` }
export const fmtShotsPerGoal = (s: ShotTotals | null | undefined) => { const v = s && s.matches > 0 ? shotsPerGoal(s) : null; return v == null ? DASH : v.toLocaleString('fr-FR') }
/** valeurs de tri (null = vide, toujours en bas) */
export const sortShots = (s: ShotTotals | null | undefined, k: 'shots' | 'on_target') => (s && s.matches > 0 ? s[k] : null)
export const sortAccuracy = (s: ShotTotals | null | undefined) => (s && s.matches > 0 ? shotAccuracy(s) : null)
export const sortShotsPerGoal = (s: ShotTotals | null | undefined) => (s && s.matches > 0 ? shotsPerGoal(s) : null)
