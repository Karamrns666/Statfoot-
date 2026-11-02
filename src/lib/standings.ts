// Classements, forme, confrontations — fonctions pures.
import type { Competition, Match, MatchEvent, MatchStage, Settings, Tiebreaker } from '@/types/entities'

export const KNOCKOUT_STAGES: MatchStage[] = ['round_of_16', 'quarter', 'semi', 'third_place', 'final']
export const isKnockout = (m: Pick<Match, 'stage'>) => !!m.stage && KNOCKOUT_STAGES.includes(m.stage)

export const DEFAULT_TIEBREAKERS: Tiebreaker[] = ['points', 'goal_diff', 'goals_for', 'head_to_head', 'fair_play']
export function pointsConfig(s?: Partial<Settings> | null) {
  return { win: s?.points_win ?? 3, draw: s?.points_draw ?? 1, loss: s?.points_loss ?? 0, tiebreakers: s?.tiebreakers?.length ? s.tiebreakers : DEFAULT_TIEBREAKERS }
}

/** Un match compte s'il est terminé, publié et a un score. */
export const isPlayed = (m: Match) =>
  m.status === 'finished' && typeof m.home_score === 'number' && typeof m.away_score === 'number' && m.published !== false

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
    if (e.type === 'yellow_card') r.yellow++
    if (e.type === 'red_card' || e.type === 'second_yellow') r.red++
  }
  for (const r of rows.values()) { r.gd = r.gf - r.ga; r.form = r.results.slice(-5) }
  return rows
}

function value(c: Tiebreaker, r: StandingRow) {
  switch (c) {
    case 'points': return r.points
    case 'goal_diff': return r.gd
    case 'goals_for': return r.gf
    case 'wins': return r.won
    case 'fair_play': return -(r.yellow + 3 * r.red)
    default: return 0
  }
}

/** Tri récursif ; 'head_to_head' = mini-classement entre les équipes encore à égalité. */
export function sortStandings(rows: StandingRow[], criteria: Tiebreaker[], matches: Match[], settings?: Partial<Settings> | null, order?: (a: string, b: string) => number): StandingRow[] {
  if (rows.length <= 1) return rows
  if (!criteria.length) return [...rows].sort((a, b) => (order ? order(a.team_id, b.team_id) : a.team_id.localeCompare(b.team_id)))
  const [c, ...rest] = criteria
  let key: (r: StandingRow) => number
  if (c === 'head_to_head') {
    const ids = new Set(rows.map((r) => r.team_id))
    const mini = computeTable(matches.filter((m) => ids.has(m.home_team_id) && ids.has(m.away_team_id)), [...ids], settings)
    key = (r) => { const x = mini.get(r.team_id)!; return x.points * 1e6 + (x.gd + 1000) * 1e3 + x.gf }
  } else key = (r) => value(c, r)
  const buckets = new Map<number, StandingRow[]>()
  for (const r of rows) { const k = key(r); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k)!.push(r) }
  return [...buckets.keys()].sort((a, b) => b - a).flatMap((k) => sortStandings(buckets.get(k)!, rest, matches, settings, order))
}

export function computeStandings(matches: Match[], teamIds: string[], settings?: Partial<Settings> | null, events: MatchEvent[] = [], order?: (a: string, b: string) => number): StandingRow[] {
  const table = computeTable(matches, teamIds, settings, events)
  const rows = [...table.values()].map(({ results: _r, ...row }) => { void _r; return row })
  return sortStandings(rows, pointsConfig(settings).tiebreakers, matches.filter(isPlayed), settings, order).map((r, i) => ({ ...r, rank: i + 1 }))
}

export interface StandingsInput { competitions: Competition[]; matches: Match[]; events: MatchEvent[]; settings: Partial<Settings>; teams: { id: string; name: string }[] }

/** Classement d'une compétition (hors phase finale). `beforeRound` : classement avant une journée donnée. */
export function competitionStandings(data: StandingsInput, competitionId: string, opts: { beforeRound?: number; teamIds?: string[] } = {}): StandingRow[] {
  const comp = data.competitions.find((c) => c.id === competitionId)
  const teamIds = opts.teamIds ?? comp?.team_ids ?? []
  const ms = data.matches.filter((m) => m.competition_id === competitionId && !isKnockout(m) && (opts.beforeRound == null || (m.round ?? 0) < opts.beforeRound))
  const name = new Map(data.teams.map((t) => [t.id, t.name]))
  return computeStandings(ms, teamIds, data.settings, data.events, (a, b) => (name.get(a) ?? a).localeCompare(name.get(b) ?? b))
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
