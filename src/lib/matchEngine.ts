// ============================================================================
//  Moteur du Match Center — fonctions PURES.
//  Utilisé à l'identique par l'écran opérateur, la fiche match publique et le mode TV.
//  Chrono, minutes (temps additionnel), possession, stats, tirs cadrés automatiques,
//  2 jaunes, CSC, tirs au but, annulation, minutes jouées, gardien, checklist de clôture.
// ============================================================================
import type {
  EventType, LivePeriod, LiveState, Lineup, Match, MatchEvent, Period, PossessionSlice, Player, Suspension,
} from '@/types/entities'

export type Side = 'home' | 'away'
export const DEFAULT_HALF_MIN = 15

// ---------------------------------------------------------------------------
//  Chrono
// ---------------------------------------------------------------------------
export function newLiveState(match_id: string): Omit<LiveState, 'id'> {
  return { match_id, period: 'pre', running: false, period_started_at: null, period_elapsed_ms: 0, added_time: {}, possession: { current: 'dead', since: null, by_period: {} }, version: 0 }
}

export const PLAYING_PERIODS: Period[] = ['1H', '2H', 'ET1', 'ET2']
export const isPlaying = (p: LivePeriod): p is '1H' | '2H' | 'ET1' | 'ET2' => (PLAYING_PERIODS as string[]).includes(p)

export function elapsedMs(ls: Pick<LiveState, 'period_elapsed_ms' | 'running' | 'period_started_at'>, now: number) {
  return ls.period_elapsed_ms + (ls.running && ls.period_started_at ? Math.max(0, now - ls.period_started_at) : 0)
}

export interface Durations { half: number; et: number }
export function periodLength(p: Period, d: Durations) { return p === 'ET1' || p === 'ET2' ? d.et : d.half }
export function periodOffset(p: Period, d: Durations) {
  return p === '1H' ? 0 : p === '2H' ? d.half : p === 'ET1' ? 2 * d.half : p === 'ET2' ? 2 * d.half + d.et : 2 * d.half + 2 * d.et
}

/**
 * Minute "football" : la 1re minute est 1'. Au-delà de la durée de la période, on affiche le temps additionnel.
 * Ex. mi-temps de 15 min, 16 min 30 jouées en 1re MT → { minute: 15, added: 2 } → "15+2'".
 */
export function footballMinute(p: Period, ms: number, d: Durations): { minute: number; added: number } {
  const len = periodLength(p, d)
  const off = periodOffset(p, d)
  const m = Math.floor(ms / 60000) + 1
  if (m > len) return { minute: off + len, added: m - len }
  return { minute: off + m, added: 0 }
}
export const fmtMinute = (minute?: number, added?: number) => (minute == null ? '' : added ? `${minute}+${added}'` : `${minute}'`)
export function fmtClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Minute courante pour horodater une action */
export function currentMinute(ls: LiveState, d: Durations, now: number): { period: Period; minute: number; added: number; clock_ms: number } {
  const p: Period = isPlaying(ls.period) ? ls.period : ls.period === 'PENS' ? 'PENS' : ls.period === 'HT' ? '1H' : ls.period === 'ET_BREAK' ? '2H' : ls.period === 'FT' ? '2H' : '1H'
  if (p === 'PENS') return { period: 'PENS', minute: periodOffset('PENS', d), added: 0, clock_ms: 0 }
  const ms = isPlaying(ls.period) ? elapsedMs(ls, now) : periodLength(p, d) * 60000 - 1
  return { period: p, ...footballMinute(p, ms, d), clock_ms: ms }
}

/** Libellé du statut pour les pastilles */
export function liveLabel(ls: LiveState | undefined, d: Durations, now: number): string {
  if (!ls || ls.period === 'pre') return 'À venir'
  if (ls.period === 'HT') return 'Mi-temps'
  if (ls.period === 'ET_BREAK') return 'Pause prolongation'
  if (ls.period === 'PENS') return 'Tirs au but'
  if (ls.period === 'FT') return 'Terminé'
  if (!ls.running) return 'Pause'
  const m = footballMinute(ls.period as Period, elapsedMs(ls, now), d)
  return fmtMinute(m.minute, m.added)
}

// --- possession ------------------------------------------------------------
function slice(ls: LiveState, p: Period): PossessionSlice {
  return { home_ms: 0, away_ms: 0, dead_ms: 0, ...(ls.possession?.by_period[p] ?? {}) }
}

/** Ajoute le temps écoulé depuis `since` au camp courant (uniquement si le chrono tourne). */
function accumulate(ls: LiveState, now: number): LiveState {
  const pos = ls.possession ?? { current: 'dead' as const, since: null, by_period: {} }
  if (!ls.running || !isPlaying(ls.period) || pos.since == null) return { ...ls, possession: { ...pos, since: ls.running ? now : null } }
  const p = ls.period as Period
  const s = slice(ls, p)
  const dt = Math.max(0, now - pos.since)
  const key = pos.current === 'home' ? 'home_ms' : pos.current === 'away' ? 'away_ms' : 'dead_ms'
  return { ...ls, possession: { ...pos, since: now, by_period: { ...pos.by_period, [p]: { ...s, [key]: s[key] + dt } } } }
}

export function setPossession(ls: LiveState, side: Side | 'dead', now: number): LiveState {
  const a = accumulate(ls, now)
  return { ...a, possession: { ...a.possession!, current: side, since: a.running ? now : null } }
}

/** Possession cumulée (ballon mort exclu du %) pour une période ou tout le match */
export function possession(ls: LiveState | undefined, now: number, period?: Period) {
  if (!ls?.possession) return { home_ms: 0, away_ms: 0, dead_ms: 0, home_pct: 50, away_pct: 50 }
  const live = accumulate(ls, now)
  const periods = period ? [period] : PLAYING_PERIODS
  const t = periods.reduce((acc, p) => {
    const s = live.possession!.by_period[p]
    if (s) { acc.home_ms += s.home_ms; acc.away_ms += s.away_ms; acc.dead_ms += s.dead_ms }
    return acc
  }, { home_ms: 0, away_ms: 0, dead_ms: 0 })
  const tot = t.home_ms + t.away_ms
  const home_pct = tot ? Math.round((t.home_ms / tot) * 100) : 50
  return { ...t, home_pct, away_pct: 100 - home_pct }
}

// --- transitions -----------------------------------------------------------
export function startPeriod(ls: LiveState, p: Period, now: number): LiveState {
  return { ...ls, period: p, running: true, period_started_at: now, period_elapsed_ms: 0, possession: { ...(ls.possession ?? { by_period: {} }), current: 'dead', since: now, by_period: ls.possession?.by_period ?? {} } }
}
export function pause(ls: LiveState, now: number): LiveState {
  if (!ls.running) return ls
  const a = accumulate(ls, now)
  return { ...a, running: false, period_elapsed_ms: elapsedMs(ls, now), period_started_at: null, possession: { ...a.possession!, since: null } }
}
export function resume(ls: LiveState, now: number): LiveState {
  if (ls.running || !isPlaying(ls.period)) return ls
  return { ...ls, running: true, period_started_at: now, possession: { ...ls.possession!, since: now } }
}
export function endPeriod(ls: LiveState, next: LivePeriod, now: number): LiveState {
  const p = pause(ls, now)
  return { ...p, period: next, period_elapsed_ms: 0 }
}
export function setAddedTime(ls: LiveState, p: Period, minutes: number): LiveState {
  return { ...ls, added_time: { ...(ls.added_time ?? {}), [p]: Math.max(0, minutes) } }
}

/** Prochaine étape proposée au bouton principal du tableau de score */
export function nextStep(ls: LiveState | undefined, opts: { extraTime: boolean; drawn: boolean }): { label: string; action: 'kickoff' | 'halftime' | 'second_half' | 'end_regular' | 'start_et1' | 'start_et2' | 'end_et' | 'end_match' } | null {
  const p = ls?.period ?? 'pre'
  switch (p) {
    case 'pre': return { label: "Coup d'envoi", action: 'kickoff' }
    case '1H': return { label: 'Mi-temps', action: 'halftime' }
    case 'HT': return { label: 'Début 2e MT', action: 'second_half' }
    case '2H': return opts.extraTime && opts.drawn ? { label: 'Fin du temps réglementaire', action: 'end_regular' } : { label: 'Fin du match', action: 'end_match' }
    case 'ET_BREAK': return { label: 'Début prolongation', action: 'start_et1' }
    case 'ET1': return { label: '2e période de prolongation', action: 'start_et2' }
    case 'ET2': return opts.drawn ? { label: 'Tirs au but', action: 'end_et' } : { label: 'Fin du match', action: 'end_match' }
    case 'PENS': return { label: 'Fin du match', action: 'end_match' }
    default: return null
  }
}

// ---------------------------------------------------------------------------
//  Événements
// ---------------------------------------------------------------------------
const GOAL_TYPES: EventType[] = ['goal']
export const isGoalEvent = (e: Pick<MatchEvent, 'type'>) => GOAL_TYPES.includes(e.type) || e.type === 'own_goal'

export function sideOf(m: Pick<Match, 'home_team_id'>, teamId: string): Side { return m.home_team_id === teamId ? 'home' : 'away' }
export function otherTeam(m: Pick<Match, 'home_team_id' | 'away_team_id'>, teamId: string) { return teamId === m.home_team_id ? m.away_team_id : m.home_team_id }

/** Score depuis les événements. Un CSC compte pour l'adversaire. Les tirs au but sont à part. */
export function scoreFromEvents(m: Pick<Match, 'home_team_id' | 'away_team_id'>, events: MatchEvent[], upTo?: Period[]) {
  let home = 0, away = 0
  for (const e of events) {
    if (upTo && e.period && !upTo.includes(e.period)) continue
    if (e.type === 'goal') { if (e.team_id === m.home_team_id) home++; else if (e.team_id === m.away_team_id) away++ }
    else if (e.type === 'own_goal') { if (e.team_id === m.home_team_id) away++; else if (e.team_id === m.away_team_id) home++ }
  }
  return { home, away }
}

export interface NewEvent extends Omit<MatchEvent, 'id'> { id?: string }

/**
 * Construit les événements à créer pour une action, avec les événements automatiques :
 *  - but (hors CSC) → +1 tir cadré pour l'équipe qui marque ;
 *  - arrêt / penalty arrêté du gardien → +1 tir cadré pour l'adversaire ;
 *  - 2e jaune du même joueur → type 'second_yellow' (vaut rouge).
 * Les événements automatiques portent `auto: true` et `parent_event_id` → supprimés avec le parent.
 */
export function buildAction(m: Pick<Match, 'id' | 'home_team_id' | 'away_team_id'>, existing: MatchEvent[], action: NewEvent, makeId: () => string): NewEvent[] {
  const main: NewEvent = { ...action, id: action.id ?? makeId(), match_id: m.id }
  if (main.type === 'yellow_card' && main.player_id && existing.some((e) => e.player_id === main.player_id && e.type === 'yellow_card')) {
    main.type = 'second_yellow'
  }
  if (main.type === 'goal' && main.goal_kind === 'penalty') main.related_player_id = undefined
  const out: NewEvent[] = [main]
  const auto = (team_id: string): NewEvent => ({
    id: makeId(), match_id: m.id, team_id, type: 'shot_on_target', auto: true, parent_event_id: main.id,
    period: main.period, minute: main.minute, added_minute: main.added_minute, clock_ms: main.clock_ms, client_ts: main.client_ts, operator: main.operator,
  })
  if (main.type === 'goal') out.push(auto(main.team_id))
  if (main.type === 'save' || main.type === 'penalty_saved') out.push(auto(otherTeam(m, main.team_id)))
  return out
}

/** Effet d'une action sur la possession : corner/touche/coup franc → ballon à l'équipe ; but → ballon mort. */
export function possessionAfter(m: Pick<Match, 'home_team_id'>, e: Pick<MatchEvent, 'type' | 'team_id'>): Side | 'dead' | null {
  if (e.type === 'corner' || e.type === 'throw_in' || e.type === 'free_kick') return sideOf(m, e.team_id)
  if (e.type === 'goal' || e.type === 'own_goal') return 'dead'
  return null
}

/** Ids à supprimer pour annuler un événement (lui + ses événements automatiques). */
export function idsToRemove(events: MatchEvent[], eventId: string): string[] {
  return [eventId, ...events.filter((e) => e.parent_event_id === eventId).map((e) => e.id)]
}

/** Dernière action "manuelle" (les événements auto sont annulés avec leur parent). */
export function lastManualEvent(events: MatchEvent[]): MatchEvent | undefined {
  const manual = events.filter((e) => !e.auto)
  return manual.sort((a, b) => (a.client_ts ?? a.created_date ?? '').localeCompare(b.client_ts ?? b.created_date ?? '')).at(-1)
}

/** Correction d'un événement sans suppression, avec historique. */
export function correctEvent(e: MatchEvent, patch: Partial<MatchEvent>, by: string, at: string): MatchEvent {
  const before: Partial<MatchEvent> = {}
  for (const k of Object.keys(patch) as (keyof MatchEvent)[]) (before as Record<string, unknown>)[k] = e[k]
  return { ...e, ...patch, revisions: [...(e.revisions ?? []), { at, by, before }] }
}

export const sortEvents = (events: MatchEvent[]) =>
  [...events].sort((a, b) => periodOrder(a.period) - periodOrder(b.period) || (a.minute ?? 0) - (b.minute ?? 0) || (a.added_minute ?? 0) - (b.added_minute ?? 0) || (a.clock_ms ?? 0) - (b.clock_ms ?? 0) || (a.client_ts ?? '').localeCompare(b.client_ts ?? ''))
const periodOrder = (p?: Period) => (p ? ['1H', '2H', 'ET1', 'ET2', 'PENS'].indexOf(p) : 0)

// ---------------------------------------------------------------------------
//  Statistiques d'équipe (Match / 1re MT / 2e MT)
// ---------------------------------------------------------------------------
export interface TeamLiveStats {
  possession: number; goals: number; shots: number; shots_on_target: number; shots_off_target: number; saves: number
  corners: number; throw_ins: number; free_kicks: number; fouls: number; offsides: number; yellow: number; red: number
}
export const STAT_LABELS: { key: keyof TeamLiveStats; label: string; lowerIsBetter?: boolean; pct?: boolean }[] = [
  { key: 'possession', label: 'Possession', pct: true }, { key: 'goals', label: 'Buts' }, { key: 'shots', label: 'Tirs totaux' },
  { key: 'shots_on_target', label: 'Tirs cadrés' }, { key: 'shots_off_target', label: 'Tirs non cadrés' }, { key: 'saves', label: 'Arrêts' },
  { key: 'corners', label: 'Corners' }, { key: 'throw_ins', label: 'Touches' }, { key: 'free_kicks', label: 'Coups francs' },
  { key: 'fouls', label: 'Fautes', lowerIsBetter: true }, { key: 'offsides', label: 'Hors-jeu', lowerIsBetter: true },
  { key: 'yellow', label: 'Cartons jaunes', lowerIsBetter: true }, { key: 'red', label: 'Cartons rouges', lowerIsBetter: true },
]

export function teamStats(m: Pick<Match, 'home_team_id' | 'away_team_id'>, events: MatchEvent[], ls: LiveState | undefined, now: number, period?: '1H' | '2H'): Record<Side, TeamLiveStats> {
  const evs = events.filter((e) => !period || e.period === period || (period === '2H' && (e.period === 'ET1' || e.period === 'ET2')))
  const pos = possession(ls, now, period)
  const one = (side: Side): TeamLiveStats => {
    const tid = side === 'home' ? m.home_team_id : m.away_team_id
    const mine = evs.filter((e) => e.team_id === tid)
    const c = (...t: EventType[]) => mine.filter((e) => t.includes(e.type)).length
    const on = c('shot_on_target')
    const off = c('shot_off_target', 'penalty_missed')
    return {
      possession: side === 'home' ? pos.home_pct : pos.away_pct,
      goals: c('goal') + evs.filter((e) => e.type === 'own_goal' && e.team_id !== tid).length,
      shots: on + off, shots_on_target: on, shots_off_target: off, saves: c('save', 'penalty_saved'),
      corners: c('corner'), throw_ins: c('throw_in'), free_kicks: c('free_kick'), fouls: c('foul'), offsides: c('offside'),
      yellow: c('yellow_card', 'second_yellow'), red: c('red_card', 'second_yellow'),
    }
  }
  return { home: one('home'), away: one('away') }
}

/** Fautes cumulées d'une équipe sur une période (alerte au seuil) */
export function foulsInPeriod(events: MatchEvent[], teamId: string, p: Period) {
  return events.filter((e) => e.team_id === teamId && e.type === 'foul' && e.period === p).length
}

// ---------------------------------------------------------------------------
//  Joueurs : minutes jouées, gardien, cartons
// ---------------------------------------------------------------------------
export function totalMinutes(d: Durations, extraTime: boolean) { return 2 * d.half + (extraTime ? 2 * d.et : 0) }

/** Minutes jouées : titulaires dès 0', entrants à la minute du remplacement, sortie au remplacement ou au rouge. */
export function minutesPlayed(lineup: Pick<Lineup, 'starter_ids'> | undefined, events: MatchEvent[], teamId: string, total: number): Map<string, number> {
  const on = new Map<string, number>()
  const out = new Map<string, number>()
  for (const id of lineup?.starter_ids ?? []) on.set(id, 0)
  for (const e of sortEvents(events.filter((x) => x.team_id === teamId))) {
    const t = Math.min(total, e.minute ?? 0)
    if (e.type === 'substitution') {
      if (e.player_id && !on.has(e.player_id)) on.set(e.player_id, t)
      if (e.related_player_id && on.has(e.related_player_id) && !out.has(e.related_player_id)) out.set(e.related_player_id, t)
    }
    if ((e.type === 'red_card' || e.type === 'second_yellow') && e.player_id && on.has(e.player_id) && !out.has(e.player_id)) out.set(e.player_id, t)
  }
  const res = new Map<string, number>()
  for (const [id, start] of on) res.set(id, Math.max(0, (out.get(id) ?? total) - start))
  return res
}

/** Joueurs ayant participé (titulaires + entrés en jeu). */
export function participants(lineup: Pick<Lineup, 'starter_ids'> | undefined, events: MatchEvent[], teamId: string): Set<string> {
  const s = new Set(lineup?.starter_ids ?? [])
  for (const e of events) if (e.team_id === teamId && e.type === 'substitution' && e.player_id) s.add(e.player_id)
  return s
}

/** Gardien en jeu à une minute donnée (changement de gardien via 'gk_change', player_id = nouveau gardien). */
export function goalkeeperAt(lineup: Pick<Lineup, 'goalkeeper_id'> | undefined, events: MatchEvent[], teamId: string, minute: number, period?: Period): string | undefined {
  let gk = lineup?.goalkeeper_id
  for (const e of sortEvents(events.filter((x) => x.team_id === teamId && x.type === 'gk_change'))) {
    if (periodOrder(e.period) < periodOrder(period) || (periodOrder(e.period) === periodOrder(period) && (e.minute ?? 0) <= minute)) gk = e.player_id
  }
  return gk
}

export interface KeeperMatch { player_id: string; conceded: number; saves: number; penalties_saved: number; shootout_saved: number; clean_sheet: boolean; full_match: boolean }
/** Stats gardien d'une équipe sur un match : buts encaissés attribués au gardien en jeu ; clean sheet seulement pour un gardien ayant joué tout le match. */
export function keeperMatchStats(m: Pick<Match, 'home_team_id' | 'away_team_id'>, lineup: Lineup | undefined, events: MatchEvent[], teamId: string): KeeperMatch[] {
  const opp = otherTeam(m, teamId)
  const changes = events.filter((e) => e.team_id === teamId && e.type === 'gk_change')
  const ids = new Set<string>([lineup?.goalkeeper_id, ...changes.map((e) => e.player_id)].filter(Boolean) as string[])
  const res = new Map<string, KeeperMatch>()
  for (const id of ids) res.set(id, { player_id: id, conceded: 0, saves: 0, penalties_saved: 0, shootout_saved: 0, clean_sheet: false, full_match: changes.length === 0 && id === lineup?.goalkeeper_id })
  for (const e of events) {
    const against = (e.type === 'goal' && e.team_id === opp) || (e.type === 'own_goal' && e.team_id === teamId)
    if (against) {
      const gk = goalkeeperAt(lineup, events, teamId, e.minute ?? 0, e.period)
      if (gk && res.has(gk)) res.get(gk)!.conceded++
    }
    if (e.team_id === teamId && e.player_id && res.has(e.player_id)) {
      if (e.type === 'save') res.get(e.player_id)!.saves++
      if (e.type === 'penalty_saved') res.get(e.player_id)!.penalties_saved++
    }
    if (e.type === 'shootout_saved' && e.team_id === opp && e.related_player_id && res.has(e.related_player_id)) res.get(e.related_player_id)!.shootout_saved++
  }
  const teamConceded = [...res.values()].reduce((a, k) => a + k.conceded, 0)
  for (const k of res.values()) k.clean_sheet = k.full_match && teamConceded === 0
  return [...res.values()]
}

/** Badges à côté d'un joueur : ⚽×n, 🅰×n, 🟨, 🟥 */
export function playerBadges(events: MatchEvent[], playerId: string) {
  const goals = events.filter((e) => e.type === 'goal' && e.player_id === playerId).length
  const assists = events.filter((e) => e.type === 'goal' && e.related_player_id === playerId).length
  const yellow = events.filter((e) => (e.type === 'yellow_card' || e.type === 'second_yellow') && e.player_id === playerId).length
  const red = events.some((e) => (e.type === 'red_card' || e.type === 'second_yellow') && e.player_id === playerId)
  const og = events.filter((e) => e.type === 'own_goal' && e.player_id === playerId).length
  return { goals, assists, yellow, red, og }
}

// ---------------------------------------------------------------------------
//  Tirs au but (5 tireurs puis mort subite)
// ---------------------------------------------------------------------------
export interface ShootoutKick { team_id: string; player_id?: string; result: 'scored' | 'saved' | 'missed'; order: number }
export function shootout(m: Pick<Match, 'home_team_id' | 'away_team_id'>, events: MatchEvent[], kicksPerSide = 5) {
  const kicks = events.filter((e) => e.type === 'shootout_scored' || e.type === 'shootout_saved' || e.type === 'shootout_missed')
    .sort((a, b) => (a.shootout_order ?? 0) - (b.shootout_order ?? 0) || (a.client_ts ?? '').localeCompare(b.client_ts ?? ''))
  const home = kicks.filter((k) => k.team_id === m.home_team_id), away = kicks.filter((k) => k.team_id === m.away_team_id)
  const sh = home.filter((k) => k.type === 'shootout_scored').length, sa = away.filter((k) => k.type === 'shootout_scored').length
  const nh = home.length, na = away.length
  let decided = false
  if (nh <= kicksPerSide && na <= kicksPerSide) {
    // phase régulière : décidé si une équipe ne peut plus rattraper
    if (sh > sa + (kicksPerSide - na) || sa > sh + (kicksPerSide - nh)) decided = true
    else if (nh === kicksPerSide && na === kicksPerSide && sh !== sa) decided = true
  } else if (nh === na && sh !== sa) decided = true // mort subite : même nombre de tirs
  const nextTeam = nh <= na ? m.home_team_id : m.away_team_id
  return { home, away, home_score: sh, away_score: sa, decided, winner: decided ? (sh > sa ? m.home_team_id : m.away_team_id) : null, nextTeam, nextOrder: kicks.length + 1, suddenDeath: nh >= kicksPerSide && na >= kicksPerSide }
}

export function fmtScore(m: Pick<Match, 'home_score' | 'away_score' | 'penalties' | 'home_pens' | 'away_pens'>) {
  const base = `${m.home_score ?? 0}-${m.away_score ?? 0}`
  return m.penalties && m.home_pens != null ? `${base} (${m.home_pens}-${m.away_pens} tab)` : base
}

// ---------------------------------------------------------------------------
//  Éligibilité (compo d'avant-match) & clôture
// ---------------------------------------------------------------------------
/** Matchs purgés = matchs validés de l'équipe du joueur joués APRÈS le match d'origine de la suspension. */
export function suspensionRemaining(s: Suspension, teamMatchesAfterOrigin: number) {
  return Math.max(0, s.matches - teamMatchesAfterOrigin)
}

export function eligibility(player: Player, opts: { suspendedMatchesLeft: number }) {
  const reasons: { reason: 'suspended' | 'documents'; label: string }[] = []
  if (opts.suspendedMatchesLeft > 0) reasons.push({ reason: 'suspended', label: `Suspendu (${opts.suspendedMatchesLeft} match${opts.suspendedMatchesLeft > 1 ? 's' : ''} restant${opts.suspendedMatchesLeft > 1 ? 's' : ''})` })
  const docs = player.documents ?? {}
  const missing = (['id_card', 'medical', 'license'] as const).filter((k) => docs[k]?.status !== 'valid')
  if (missing.length) reasons.push({ reason: 'documents', label: `Documents non validés : ${missing.map((k) => ({ id_card: 'CIN', medical: 'certificat médical', license: 'licence' })[k]).join(', ')}` })
  return { blocked: reasons.length > 0, reasons }
}

export interface ChecklistItem { key: string; label: string; ok: boolean; blocking: boolean }
export function closureChecklist(m: Match, events: MatchEvent[], lineups: Lineup[], opts: { knockout: boolean }): ChecklistItem[] {
  const s = scoreFromEvents(m, events)
  const so = shootout(m, events)
  const homeLu = lineups.find((l) => l.team_id === m.home_team_id), awayLu = lineups.find((l) => l.team_id === m.away_team_id)
  const cards = events.filter((e) => e.type === 'yellow_card' || e.type === 'second_yellow' || e.type === 'red_card')
  const items: ChecklistItem[] = [
    { key: 'lineups', label: 'Compositions validées (2 équipes)', ok: !!homeLu?.validated && !!awayLu?.validated, blocking: false },
    { key: 'score', label: `Score cohérent avec les buts saisis (${s.home}-${s.away})`, ok: (m.home_score ?? s.home) === s.home && (m.away_score ?? s.away) === s.away, blocking: true },
    { key: 'cards', label: 'Tous les cartons attribués à un joueur', ok: cards.every((c) => !!c.player_id), blocking: false },
    { key: 'motm', label: 'Homme du match désigné', ok: !!m.motm_player_id, blocking: false },
  ]
  if (opts.knockout && s.home === s.away) items.push({ key: 'shootout', label: 'Vainqueur désigné (tirs au but)', ok: so.decided, blocking: true })
  return items
}

/** Résumé chronologique séparé par période */
export function timelineByPeriod(events: MatchEvent[]) {
  const KEEP: EventType[] = ['goal', 'own_goal', 'penalty_missed', 'penalty_saved', 'yellow_card', 'second_yellow', 'red_card', 'substitution', 'goal_disallowed', 'gk_change']
  const out = new Map<Period, MatchEvent[]>()
  for (const e of sortEvents(events.filter((x) => KEEP.includes(x.type)))) {
    const p = e.period ?? '1H'
    if (!out.has(p)) out.set(p, [])
    out.get(p)!.push(e)
  }
  return out
}
export const PERIOD_LABEL: Record<Period, string> = { '1H': '1re mi-temps', '2H': '2e mi-temps', ET1: 'Prolongation 1', ET2: 'Prolongation 2', PENS: 'Tirs au but' }

/** Durées d'un match (mi-temps 15 min par défaut, prolongation 5 min) */
export function durationsFor(m?: Pick<Match, 'half_duration_min'> | null, comp?: { half_duration_min?: number; extra_time?: { enabled: boolean; period_min: number } } | null): Durations {
  return { half: m?.half_duration_min ?? comp?.half_duration_min ?? DEFAULT_HALF_MIN, et: comp?.extra_time?.period_min ?? 5 }
}
