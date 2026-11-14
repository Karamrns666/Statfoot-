// Classements, forme, confrontations — fonctions pures.
import { activeAdjustments, applyAdjustments, applyForcedOrder } from './adjustments'
import type { Competition, Match, MatchEvent, MatchStage, Settings, StandingAdjustment } from '@/types/entities'
import { REGLEMENT, isDisputed, rankTable, type TiebreakReason } from './reglement'

export const KNOCKOUT_STAGES: MatchStage[] = ['round_of_16', 'quarter', 'semi', 'third_place', 'final']
export const isKnockout = (m: Pick<Match, 'stage'>) => !!m.stage && KNOCKOUT_STAGES.includes(m.stage)

/** Points (Art. 17.2) — lus dans le module de règles, plus dans les réglages. */
export function pointsConfig(_s?: unknown) {
  void _s
  return { win: REGLEMENT.points.win, draw: REGLEMENT.points.draw, loss: REGLEMENT.points.loss }
}

/** Un match compte s'il est terminé, publié et a un score. */
export const isPlayed = (m: Match) => isDisputed(m)

export function byDate(a: Match, b: Match) {
  return (a.date ?? '').localeCompare(b.date ?? '') || (a.round ?? 0) - (b.round ?? 0) || a.id.localeCompare(b.id)
}

export type Result = 'W' | 'D' | 'L'
/** Résultat "réglementaire" (un match gagné aux tirs au but reste un nul pour le classement et l'XP). */
export function resultFor(m: Match, teamId: string): Result | null {
  if (!isPlayed(m)) return null
  const home = m.home_team_id === teamId
  const gf = home ? m.home_score! : m.away_score!
  const ga = home ? m.away_score! : m.home_score!
  return gf > ga ? 'W' : gf < ga ? 'L' : 'D'
}

/** Vainqueur qualifié (tirs au but pris en compte) */
export function winnerOf(m: Match): string | null {
  if (!isPlayed(m)) return null
  if (m.home_score! !== m.away_score!) return m.home_score! > m.away_score! ? m.home_team_id : m.away_team_id
  if (m.penalties && m.home_pens != null && m.away_pens != null && m.home_pens !== m.away_pens) return m.home_pens > m.away_pens ? m.home_team_id : m.away_team_id
  return null
}
export function loserOf(m: Match): string | null {
  const w = winnerOf(m)
  return w ? (w === m.home_team_id ? m.away_team_id : m.home_team_id) : null
}

export interface StandingRow {
  team_id: string; rank: number; played: number; won: number; drawn: number; lost: number
  gf: number; ga: number; gd: number; points: number; yellow: number; red: number; form: Result[]
  /** pourquoi l'équipe est derrière celle du dessus à égalité de points (Art. 17.3) */
  tiebreak?: TiebreakReason
  /** ajustements manuels actifs appliqués à cette équipe (icône + infobulle publiques) */
  adjustments?: StandingAdjustment[]
}
const emptyRow = (team_id: string): StandingRow => ({ team_id, rank: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, yellow: 0, red: 0, form: [] })

export function computeTable(matches: Match[], teamIds: string[], settings?: Partial<Settings> | null, events: MatchEvent[] = []) {
  const pc = pointsConfig(settings)
  const rows = new Map<string, StandingRow & { results: Result[] }>()
  for (const id of teamIds) rows.set(id, { ...emptyRow(id), results: [] })
  const played = matches.filter(isPlayed).sort(byDate)
  const ids = new Set(played.map((m) => m.id))
  for (const m of played) {
    for (const home of [true, false]) {
      const id = home ? m.home_team_id : m.away_team_id
      if (!rows.has(id)) rows.set(id, { ...emptyRow(id), results: [] })
      const r = rows.get(id)!
      const gf = home ? m.home_score! : m.away_score!, ga = home ? m.away_score! : m.home_score!
      r.played++; r.gf += gf; r.ga += ga
      const res: Result = gf > ga ? 'W' : gf < ga ? 'L' : 'D'
      if (res === 'W') { r.won++; r.points += pc.win } else if (res === 'D') { r.drawn++; r.points += pc.draw } else { r.lost++; r.points += pc.loss }
      r.results.push(res)
    }
  }
  for (const e of events) {
    if (!ids.has(e.match_id)) continue
    const r = rows.get(e.team_id); if (!r) continue
    // critères 5 et 6 : cartons reçus par l'équipe (joueurs, remplaçants, officiels) ; une expulsion sur 2e jaune = 2 jaunes + 1 rouge
    if (e.type === 'yellow_card' || e.type === 'second_yellow') r.yellow++
    if (e.type === 'red_card' || e.type === 'second_yellow') r.red++
  }
  for (const r of rows.values()) { r.gd = r.gf - r.ga; r.form = r.results.slice(-5) }
  return rows
}

/** Classement trié selon l'Art. 17.3 (rang + raison du départage). */
export function computeStandings(matches: Match[], teamIds: string[], _settings?: Partial<Settings> | null, events: MatchEvent[] = [], order?: (a: string, b: string) => number, drawOrder: string[] = [], adjustments: StandingAdjustment[] = []): StandingRow[] {
  void _settings
  const table = computeTable(matches, teamIds, null, events)
  // ajustements manuels (couche séparée) : appliqués sur une copie, le calcul automatique reste intact
  const rows = applyAdjustments([...table.values()].map(({ results: _r, ...row }) => { void _r; return row as StandingRow }), adjustments)
  const played = matches.filter(isPlayed)
  const mini = (ids: string[]) => {
    const set = new Set(ids)
    return computeTable(played.filter((m) => set.has(m.home_team_id) && set.has(m.away_team_id)), ids, null)
  }
  // ordre provisoire en cas d'égalité parfaite sans tirage : `order` (nom d'équipe) sinon identifiant
  const sorted = [...rows].sort((a, b) => (order ? order(a.team_id, b.team_id) : a.team_id.localeCompare(b.team_id)))
  const names = new Map(sorted.map((r, i) => [r.team_id, String(i).padStart(4, '0')]))
  const ranked = rankTable(rows, mini, drawOrder, (id) => names.get(id) ?? id).map(({ row, reason }) => ({ ...row, tiebreak: reason }))
  // à égalité de points avec un ordre imposé, la raison du départage automatique ne s'applique plus
  const forcedPts = new Set(adjustments.filter((a) => a.forced_order != null).map((a) => ranked.find((r) => r.team_id === a.team_id)?.points))
  return applyForcedOrder(ranked, adjustments).map((r, i) => {
    const mine = adjustments.filter((a) => a.team_id === r.team_id)
    return { ...r, rank: i + 1, tiebreak: forcedPts.has(r.points) ? undefined : r.tiebreak, ...(mine.length ? { adjustments: mine } : {}) }
  })
}

export interface StandingsInput { competitions: Competition[]; matches: Match[]; events: MatchEvent[]; settings: Partial<Settings>; teams: { id: string; name: string }[]; /** ajustements manuels du super-admin */ adjustments?: StandingAdjustment[] }

/** Classement d'une compétition (hors phase finale). `beforeRound` : classement avant une journée donnée. */
export function competitionStandings(data: StandingsInput, competitionId: string, opts: { beforeRound?: number; teamIds?: string[]; /** false = calcul automatique seul */ adjusted?: boolean } = {}): StandingRow[] {
  const comp = data.competitions.find((c) => c.id === competitionId)
  const teamIds = opts.teamIds ?? comp?.team_ids ?? []
  const ms = data.matches.filter((m) => m.competition_id === competitionId && !isKnockout(m) && (opts.beforeRound == null || (m.round ?? 0) < opts.beforeRound))
  const name = new Map(data.teams.map((t) => [t.id, t.name]))
  // les ajustements valent pour le classement courant (pas pour un classement « avant la journée N »)
  const adj = opts.adjusted === false || opts.beforeRound != null ? [] : activeAdjustments(data.adjustments, competitionId)
  return computeStandings(ms, teamIds, data.settings, data.events, (a, b) => (name.get(a) ?? a).localeCompare(name.get(b) ?? b), comp?.draw_order, adj)
}

export function teamForm(matches: Match[], teamId: string, n = 5): Result[] {
  return matches.filter(isPlayed).filter((m) => m.home_team_id === teamId || m.away_team_id === teamId).sort(byDate).map((m) => resultFor(m, teamId)!).slice(-n)
}

export function headToHead(matches: Match[], a: string, b: string) {
  const ms = matches.filter(isPlayed).filter((m) => (m.home_team_id === a && m.away_team_id === b) || (m.home_team_id === b && m.away_team_id === a)).sort(byDate)
  let aw = 0, bw = 0, d = 0, ag = 0, bg = 0
  for (const m of ms) {
    const r = resultFor(m, a)
    if (r === 'W') aw++; else if (r === 'L') bw++; else d++
    ag += m.home_team_id === a ? m.home_score! : m.away_score!
    bg += m.home_team_id === b ? m.home_score! : m.away_score!
  }
  return { matches: ms, aWins: aw, bWins: bw, draws: d, aGoals: ag, bGoals: bg }
}
