// ============================================================================
//  StatFoot — moteur de calcul UNIQUE (site public ET admin).
//  Fonctions pures : (données brutes) -> résultats. Aucune lecture de store ici.
//  Toute statistique affichée dans l'application doit venir de ce fichier.
// ============================================================================
import type {
  AwardCategory, Competition, Division, Group, Lineup, Match, MatchEvent, MatchStage, Player, Position,
  Season, Settings, Team, Tiebreaker, XPAction, XPRule,
} from '@/types/entities'

export interface LeagueData {
  seasons: Season[]
  competitions: Competition[]
  divisions?: Division[]
  groups?: Group[]
  teams: Team[]
  players: Player[]
  matches: Match[]
  events: MatchEvent[]
  lineups: Lineup[]
  xpRules: XPRule[]
  settings: Partial<Settings>
}

/** Périmètre d'un calcul */
export interface Scope {
  seasonId?: string | null // null/undefined = toutes saisons
  competitionId?: string | null
  groupId?: string | null
  /** 'league' = phase de ligue / groupes uniquement ; 'knockout' = phase finale uniquement */
  phase?: 'all' | 'league' | 'knockout'
  teamId?: string | null
  /** exclut les matchs à partir de cette clé (saison+journée) — sert au calcul d'évolution du rang */
  excludeRoundKey?: string | null
  dateFrom?: string | null
  dateTo?: string | null
}

export const LEAGUE_STAGES: MatchStage[] = ['league', 'group']
export const isKnockout = (m: Pick<Match, 'stage'>) => !!m.stage && !LEAGUE_STAGES.includes(m.stage)

export const DEFAULT_SETTINGS: Required<Pick<Settings,
  'points_win' | 'points_draw' | 'points_loss' | 'tiebreakers' | 'awards_min_matches' | 'young_max_age' | 'starters_count'>> = {
  points_win: 3, points_draw: 1, points_loss: 0,
  tiebreakers: ['points', 'goal_diff', 'goals_for', 'head_to_head', 'fair_play'],
  awards_min_matches: 3, young_max_age: 23, starters_count: 6,
}

export const DEFAULT_XP_RULES: Omit<XPRule, 'id'>[] = [
  { action: 'match_played', label: 'Match joué', points: 2, order: 1 },
  { action: 'win', label: 'Victoire', points: 3, order: 2 },
  { action: 'draw', label: 'Match nul', points: 1, order: 3 },
  { action: 'goal', label: 'But', points: 10, order: 4 },
  { action: 'assist', label: 'Passe décisive', points: 6, order: 5 },
  { action: 'penalty_goal', label: 'Penalty marqué', points: 8, order: 6 },
  { action: 'own_goal', label: 'But contre son camp', points: -3, order: 7 },
  { action: 'penalty_missed', label: 'Penalty manqué', points: -3, order: 8 },
  { action: 'clean_sheet_gk', label: 'Clean sheet (gardien)', points: 8, positions: ['GK'], order: 9 },
  { action: 'clean_sheet_def', label: 'Clean sheet (défenseur)', points: 4, positions: ['DEF'], order: 10 },
  { action: 'save', label: 'Arrêt', points: 1, order: 11 },
  { action: 'penalty_saved', label: 'Penalty arrêté', points: 6, order: 12 },
  { action: 'goal_conceded_gk', label: 'But encaissé (gardien)', points: -1, positions: ['GK'], order: 13 },
  { action: 'motm', label: 'Homme du match', points: 8, order: 14 },
  { action: 'yellow_card', label: 'Carton jaune', points: -2, order: 15 },
  { action: 'red_card', label: 'Carton rouge', points: -5, order: 16 },
].map((r) => ({ active: true, ...r })) as Omit<XPRule, 'id'>[]

export function settingsWithDefaults(s?: Partial<Settings> | null) {
  return { ...DEFAULT_SETTINGS, ...(s ?? {}), tiebreakers: s?.tiebreakers?.length ? s.tiebreakers : DEFAULT_SETTINGS.tiebreakers }
}

// ---------------------------------------------------------------------------
//  Matchs
// ---------------------------------------------------------------------------
export const isPlayed = (m: Match) =>
  m.status === 'finished' && typeof m.home_score === 'number' && typeof m.away_score === 'number' && m.published !== false

export const roundKey = (m: Pick<Match, 'season_id' | 'round'>) => `${m.season_id}#${String(m.round ?? 0).padStart(3, '0')}`

export function filterMatches(matches: Match[], scope: Scope = {}): Match[] {
  return matches.filter((m) => {
    if (scope.seasonId && m.season_id !== scope.seasonId) return false
    if (scope.competitionId && m.competition_id !== scope.competitionId) return false
    if (scope.groupId && m.group_id !== scope.groupId) return false
    if (scope.teamId && m.home_team_id !== scope.teamId && m.away_team_id !== scope.teamId) return false
    if (scope.phase === 'league' && isKnockout(m)) return false
    if (scope.phase === 'knockout' && !isKnockout(m)) return false
    if (scope.excludeRoundKey && roundKey(m) >= scope.excludeRoundKey && m.season_id === scope.excludeRoundKey.split('#')[0]) return false
    if (scope.dateFrom && (m.date ?? '') < scope.dateFrom) return false
    if (scope.dateTo && (m.date ?? '') > scope.dateTo + 'T23:59:59') return false
    return true
  })
}

export const playedMatches = (matches: Match[], scope: Scope = {}) =>
  filterMatches(matches, scope).filter(isPlayed).sort(byDate)

export function byDate(a: Match, b: Match) {
  return (a.date ?? '').localeCompare(b.date ?? '') || (a.round ?? 0) - (b.round ?? 0)
}

export type Result = 'W' | 'D' | 'L'
/** Résultat d'un match pour une équipe (tirs au but pris en compte uniquement pour désigner le vainqueur d'un match à élimination). */
export function resultFor(m: Match, teamId: string): Result | null {
  if (!isPlayed(m)) return null
  const home = m.home_team_id === teamId
  const gf = home ? m.home_score! : m.away_score!
  const ga = home ? m.away_score! : m.home_score!
  if (gf > ga) return 'W'
  if (gf < ga) return 'L'
  return 'D'
}

export function winnerOf(m: Match): string | null {
  if (!isPlayed(m)) return null
  if (m.home_score! > m.away_score!) return m.home_team_id
  if (m.away_score! > m.home_score!) return m.away_team_id
  if (m.penalties && m.home_pens != null && m.away_pens != null && m.home_pens !== m.away_pens) {
    return m.home_pens > m.away_pens ? m.home_team_id : m.away_team_id
  }
  return null
}
export function loserOf(m: Match): string | null {
  const w = winnerOf(m)
  if (!w) return null
  return w === m.home_team_id ? m.away_team_id : m.home_team_id
}

/** Score recalculé depuis les événements (utilisé par le Match Center). Un CSC compte pour l'adversaire. */
export function scoreFromEvents(m: Pick<Match, 'home_team_id' | 'away_team_id'>, events: MatchEvent[], period?: '1H') {
  let home = 0, away = 0
  for (const e of events) {
    if (period && e.period !== period) continue
    if (e.type === 'goal' || e.type === 'penalty_goal') {
      if (e.team_id === m.home_team_id) home++; else if (e.team_id === m.away_team_id) away++
    } else if (e.type === 'own_goal') {
      if (e.team_id === m.home_team_id) away++; else if (e.team_id === m.away_team_id) home++
    }
  }
  return { home, away }
}

export function shootoutFromEvents(m: Pick<Match, 'home_team_id' | 'away_team_id'>, events: MatchEvent[]) {
  let home = 0, away = 0
  for (const e of events) if (e.type === 'shootout_scored') { if (e.team_id === m.home_team_id) home++; else away++ }
  return { home, away }
}

// ---------------------------------------------------------------------------
//  Classements
// ---------------------------------------------------------------------------
export interface StandingRow {
  team_id: string
  rank: number
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
  yellow: number
  red: number
  /** 5 derniers résultats, du plus ancien au plus récent */
  form: Result[]
}

function emptyRow(team_id: string): StandingRow {
  return { team_id, rank: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, yellow: 0, red: 0, form: [] }
}

export function computeTable(
  matches: Match[], teamIds: string[], settings: Partial<Settings> | null | undefined, events: MatchEvent[] = [],
): Map<string, StandingRow & { results: Result[] }> {
  const s = settingsWithDefaults(settings)
  const rows = new Map<string, StandingRow & { results: Result[] }>()
  for (const id of teamIds) rows.set(id, { ...emptyRow(id), results: [] })
  const played = matches.filter(isPlayed).sort(byDate)
  const playedIds = new Set(played.map((m) => m.id))
  for (const m of played) {
    for (const side of ['home', 'away'] as const) {
      const id = side === 'home' ? m.home_team_id : m.away_team_id
      if (!rows.has(id)) rows.set(id, { ...emptyRow(id), results: [] })
      const r = rows.get(id)!
      const gf = side === 'home' ? m.home_score! : m.away_score!
      const ga = side === 'home' ? m.away_score! : m.home_score!
      r.played++; r.gf += gf; r.ga += ga
      const res: Result = gf > ga ? 'W' : gf < ga ? 'L' : 'D'
      if (res === 'W') { r.won++; r.points += s.points_win }
      else if (res === 'D') { r.drawn++; r.points += s.points_draw }
      else { r.lost++; r.points += s.points_loss }
      r.results.push(res)
    }
  }
  for (const e of events) {
    if (!playedIds.has(e.match_id)) continue
    const r = rows.get(e.team_id)
    if (!r) continue
    if (e.type === 'yellow_card') r.yellow++
    if (e.type === 'red_card') r.red++
  }
  for (const r of rows.values()) { r.gd = r.gf - r.ga; r.form = r.results.slice(-5) }
  return rows
}

function criterionValue(c: Tiebreaker, r: StandingRow): number {
  switch (c) {
    case 'points': return r.points
    case 'goal_diff': return r.gd
    case 'goals_for': return r.gf
    case 'wins': return r.won
    case 'fair_play': return -(r.yellow + 3 * r.red)
    case 'fewer_played': return -r.played
    default: return 0
  }
}

/** Tri récursif par critères ; 'head_to_head' = mini-classement entre les équipes encore à égalité. */
export function sortStandings(rows: StandingRow[], criteria: Tiebreaker[], matches: Match[], settings?: Partial<Settings> | null, nameOf?: (id: string) => string): StandingRow[] {
  if (rows.length <= 1) return rows
  if (criteria.length === 0) {
    return [...rows].sort((a, b) => (nameOf ? nameOf(a.team_id).localeCompare(nameOf(b.team_id)) : a.team_id.localeCompare(b.team_id)))
  }
  const [c, ...rest] = criteria
  let key: (r: StandingRow) => number
  if (c === 'head_to_head') {
    const ids = new Set(rows.map((r) => r.team_id))
    const mini = computeTable(matches.filter((m) => ids.has(m.home_team_id) && ids.has(m.away_team_id)), [...ids], settings)
    key = (r) => { const x = mini.get(r.team_id)!; return x.points * 1e6 + (x.gd + 1000) * 1e3 + x.gf }
  } else key = (r) => criterionValue(c, r)
  const buckets = new Map<number, StandingRow[]>()
  for (const r of rows) { const k = key(r); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k)!.push(r) }
  const ordered = [...buckets.keys()].sort((a, b) => b - a)
  return ordered.flatMap((k) => {
    const b = buckets.get(k)!
    // si tout le monde est dans le même seau, on passe directement au critère suivant
    return sortStandings(b, rest, matches, settings, nameOf)
  })
}

export function computeStandings(
  matches: Match[], teamIds: string[], settings?: Partial<Settings> | null, events: MatchEvent[] = [],
  tiebreakers?: Tiebreaker[], nameOf?: (id: string) => string,
): StandingRow[] {
  const s = settingsWithDefaults(settings)
  const table = computeTable(matches, teamIds, settings, events)
  const rows = [...table.values()].map(({ results: _r, ...row }) => { void _r; return row })
  const leagueMatches = matches.filter(isPlayed)
  const sorted = sortStandings(rows, tiebreakers?.length ? tiebreakers : s.tiebreakers, leagueMatches, settings, nameOf)
  return sorted.map((r, i) => ({ ...r, rank: i + 1 }))
}

/** Classement d'une compétition (phase de ligue / groupes uniquement), éventuellement d'un groupe. */
export function competitionStandings(data: LeagueData, competitionId: string, groupId?: string | null): StandingRow[] {
  const comp = data.competitions.find((c) => c.id === competitionId)
  const group = groupId ? data.groups?.find((g) => g.id === groupId) : undefined
  const teamIds = group?.team_ids ?? comp?.team_ids ?? []
  const ms = filterMatches(data.matches, { competitionId, groupId: groupId ?? undefined, phase: 'league' })
    .filter((m) => !group || (teamIds.includes(m.home_team_id) && teamIds.includes(m.away_team_id)))
  return computeStandings(ms, teamIds, data.settings, data.events, comp?.tiebreakers, (id) => teamName(data, id))
}

/** Forme : 5 derniers résultats d'une équipe sur un ensemble de matchs */
export function teamForm(matches: Match[], teamId: string, n = 5): Result[] {
  return matches.filter(isPlayed).filter((m) => m.home_team_id === teamId || m.away_team_id === teamId)
    .sort(byDate).map((m) => resultFor(m, teamId)!).slice(-n)
}

export function teamName(data: Pick<LeagueData, 'teams'>, id?: string | null) {
  return data.teams.find((t) => t.id === id)?.name ?? '—'
}

// ---------------------------------------------------------------------------
//  Participation des joueurs
// ---------------------------------------------------------------------------
export interface Appearance { match: Match; player_id: string; team_id: string; is_goalkeeper: boolean; started: boolean }

/**
 * Un joueur a joué un match s'il figure dans les titulaires ou les remplaçants entrés en jeu.
 * Si aucune composition n'a été saisie pour cette équipe, on retient les joueurs ayant au moins un événement.
 */
export function matchAppearances(m: Match, data: Pick<LeagueData, 'lineups' | 'events' | 'players'>): Appearance[] {
  const out: Appearance[] = []
  const playerById = new Map(data.players.map((p) => [p.id, p]))
  for (const teamId of [m.home_team_id, m.away_team_id]) {
    const lu = data.lineups.find((l) => l.match_id === m.id && l.team_id === teamId)
    let ids: string[]
    let starters: Set<string>
    if (lu && ((lu.starter_ids?.length ?? 0) > 0)) {
      starters = new Set(lu.starter_ids)
      ids = [...new Set([...(lu.starter_ids ?? []), ...(lu.subs_entered_ids ?? [])])]
    } else {
      ids = [...new Set(data.events.filter((e) => e.match_id === m.id && e.team_id === teamId)
        .flatMap((e) => [e.player_id, e.type === 'goal' ? e.related_player_id : undefined])
        .filter((x): x is string => !!x))]
      starters = new Set(ids)
    }
    let gk = lu?.goalkeeper_id
    if (!gk || !ids.includes(gk)) gk = ids.find((id) => playerById.get(id)?.position === 'GK' && starters.has(id)) ?? ids.find((id) => playerById.get(id)?.position === 'GK')
    for (const id of ids) out.push({ match: m, player_id: id, team_id: teamId, is_goalkeeper: id === gk, started: starters.has(id) })
  }
  return out
}

// ---------------------------------------------------------------------------
//  Passes décisives — UNE seule fonction (correctif du bug "assists = 0")
// ---------------------------------------------------------------------------
/**
 * Une passe décisive est comptée :
 *  1) pour le `related_player_id` d'un événement `goal` (saisie standard) ;
 *  2) pour un événement `assist` autonome, SAUF s'il est rattaché (parent_event_id) à un but
 *     dont le passeur est déjà ce même joueur (dédoublonnage).
 * Retourne une liste {match_id, player_id, goal_event_id?}.
 */
export function collectAssists(events: MatchEvent[]): { match_id: string; player_id: string; team_id: string }[] {
  const out: { match_id: string; player_id: string; team_id: string }[] = []
  const goalsById = new Map(events.filter((e) => e.type === 'goal').map((e) => [e.id, e]))
  for (const e of events) {
    if (e.type === 'goal' && e.related_player_id && e.related_player_id !== e.player_id) {
      out.push({ match_id: e.match_id, player_id: e.related_player_id, team_id: e.team_id })
    }
  }
  for (const e of events) {
    if (e.type !== 'assist' || !e.player_id) continue
    const parent = e.parent_event_id ? goalsById.get(e.parent_event_id) : undefined
    if (parent && parent.related_player_id === e.player_id) continue
    out.push({ match_id: e.match_id, player_id: e.player_id, team_id: e.team_id })
  }
  return out
}

// ---------------------------------------------------------------------------
//  Statistiques joueur + XP
// ---------------------------------------------------------------------------
export interface PlayerStats {
  player_id: string
  team_id: string
  position: Position
  played: number
  started: number
  wins: number
  draws: number
  losses: number
  goals: number // inclut les penalties marqués (hors tirs au but)
  penalty_goals: number
  assists: number
  own_goals: number
  penalties_missed: number
  yellow: number
  red: number
  saves: number
  penalties_saved: number
  gk_matches: number
  clean_sheets: number // gardien uniquement
  team_clean_sheets: number // matchs joués sans encaisser (tous postes)
  goals_conceded: number // gardien uniquement
  motm: number
  ratings: number[]
  rating: number // moyenne
  xp: number
  xp_breakdown: { action: XPAction; label: string; count: number; points: number }[]
}

function emptyPlayerStats(p: Player): PlayerStats {
  return {
    player_id: p.id, team_id: p.team_id, position: p.position, played: 0, started: 0, wins: 0, draws: 0, losses: 0,
    goals: 0, penalty_goals: 0, assists: 0, own_goals: 0, penalties_missed: 0, yellow: 0, red: 0, saves: 0,
    penalties_saved: 0, gk_matches: 0, clean_sheets: 0, team_clean_sheets: 0, goals_conceded: 0, motm: 0,
    ratings: [], rating: 0, xp: 0, xp_breakdown: [],
  }
}

export function xpCounters(s: PlayerStats): Record<XPAction, number> {
  return {
    match_played: s.played, win: s.wins, draw: s.draws,
    goal: s.goals - s.penalty_goals, penalty_goal: s.penalty_goals, assist: s.assists,
    own_goal: s.own_goals, penalty_missed: s.penalties_missed,
    clean_sheet_gk: s.clean_sheets, clean_sheet_def: s.team_clean_sheets,
    save: s.saves, penalty_saved: s.penalties_saved, goal_conceded_gk: s.goals_conceded,
    motm: s.motm, yellow_card: s.yellow, red_card: s.red,
  }
}

export function computeXP(s: PlayerStats, rules: XPRule[] | Omit<XPRule, 'id'>[]) {
  const counters = xpCounters(s)
  let xp = 0
  const breakdown: PlayerStats['xp_breakdown'] = []
  for (const r of rules) {
    if (r.active === false) continue
    if (r.positions && r.positions.length > 0 && !r.positions.includes(s.position)) continue
    const count = counters[r.action] ?? 0
    if (!count) continue
    const pts = count * r.points
    xp += pts
    breakdown.push({ action: r.action, label: r.label ?? r.action, count, points: pts })
  }
  return { xp, breakdown }
}

/** Note de match sur 10 (sert au Player of the Tournament, aux prix par poste et à l'équipe type). */
export function matchRating(input: {
  position: Position; is_goalkeeper: boolean; goals: number; assists: number; saves: number; penalties_saved: number
  conceded: number; result: Result; yellow: number; red: number; own_goals: number; penalties_missed: number; motm: boolean
}): number {
  let r = 6
  r += input.goals * 1.0 + input.assists * 0.7
  r += input.saves * 0.15 + input.penalties_saved * 0.8
  if (input.conceded === 0) r += input.is_goalkeeper ? 1.0 : input.position === 'DEF' ? 0.5 : 0
  if (input.is_goalkeeper) r -= Math.max(0, input.conceded - 2) * 0.2
  r += input.result === 'W' ? 0.3 : input.result === 'L' ? -0.2 : 0
  r -= input.yellow * 0.3 + input.red * 1.5 + input.own_goals * 0.8 + input.penalties_missed * 0.5
  if (input.motm) r += 0.5
  return Math.round(Math.min(10, Math.max(3, r)) * 10) / 10
}

export interface PlayerMatchLine {
  match: Match; team_id: string; is_goalkeeper: boolean; started: boolean
  goals: number; assists: number; saves: number; yellow: number; red: number; conceded: number; result: Result; rating: number; motm: boolean
}

/** Calcule les lignes joueur × match pour un ensemble de matchs joués. */
export function playerMatchLines(data: LeagueData, matches: Match[]): Map<string, PlayerMatchLine[]> {
  const out = new Map<string, PlayerMatchLine[]>()
  const playerById = new Map(data.players.map((p) => [p.id, p]))
  const eventsByMatch = groupBy(data.events, (e) => e.match_id)
  for (const m of matches) {
    if (!isPlayed(m)) continue
    const evs = eventsByMatch.get(m.id) ?? []
    const assists = collectAssists(evs)
    for (const a of matchAppearances(m, { ...data, events: evs })) {
      const p = playerById.get(a.player_id)
      if (!p) continue
      const mine = evs.filter((e) => e.player_id === a.player_id)
      const cnt = (t: MatchEvent['type']) => mine.filter((e) => e.type === t).length
      const home = a.team_id === m.home_team_id
      const conceded = home ? m.away_score! : m.home_score!
      const result = resultFor(m, a.team_id)!
      const goals = cnt('goal') + cnt('penalty_goal')
      const nAssists = assists.filter((x) => x.player_id === a.player_id).length
      const motm = m.motm_player_id === a.player_id
      const line: PlayerMatchLine = {
        match: m, team_id: a.team_id, is_goalkeeper: a.is_goalkeeper, started: a.started,
        goals, assists: nAssists, saves: cnt('save') + cnt('penalty_saved'), yellow: cnt('yellow_card'), red: cnt('red_card'),
        conceded, result, motm,
        rating: matchRating({
          position: p.position, is_goalkeeper: a.is_goalkeeper, goals, assists: nAssists, saves: cnt('save'),
          penalties_saved: cnt('penalty_saved'), conceded, result, yellow: cnt('yellow_card'), red: cnt('red_card'),
          own_goals: cnt('own_goal'), penalties_missed: cnt('penalty_missed'), motm,
        }),
      }
      if (!out.has(a.player_id)) out.set(a.player_id, [])
      out.get(a.player_id)!.push(line)
    }
    // Un joueur qui a un événement mais qui n'est pas dans la compo est quand même compté (sécurité)
  }
  return out
}

export function computePlayerStats(data: LeagueData, scope: Scope = {}): Map<string, PlayerStats> {
  const matches = playedMatches(data.matches, scope)
  const matchIds = new Set(matches.map((m) => m.id))
  const events = data.events.filter((e) => matchIds.has(e.match_id))
  const stats = new Map<string, PlayerStats>()
  const playerById = new Map(data.players.map((p) => [p.id, p]))
  const get = (id: string) => {
    if (!stats.has(id)) { const p = playerById.get(id); if (!p) return null; stats.set(id, emptyPlayerStats(p)) }
    return stats.get(id)!
  }
  for (const p of data.players) if (!scope.teamId || p.team_id === scope.teamId) get(p.id)

  const lines = playerMatchLines({ ...data, events }, matches)
  for (const [pid, ls] of lines) {
    const s = get(pid); if (!s) continue
    for (const l of ls) {
      s.played++
      if (l.started) s.started++
      if (l.result === 'W') s.wins++; else if (l.result === 'D') s.draws++; else s.losses++
      if (l.conceded === 0) s.team_clean_sheets++
      if (l.is_goalkeeper) { s.gk_matches++; s.goals_conceded += l.conceded; if (l.conceded === 0) s.clean_sheets++ }
      if (l.motm) s.motm++
      s.ratings.push(l.rating)
    }
  }
  for (const e of events) {
    if (!e.player_id) continue
    const s = get(e.player_id); if (!s) continue
    switch (e.type) {
      case 'goal': s.goals++; break
      case 'penalty_goal': s.goals++; s.penalty_goals++; break
      case 'own_goal': s.own_goals++; break
      case 'penalty_missed': s.penalties_missed++; break
      case 'yellow_card': s.yellow++; break
      case 'red_card': s.red++; break
      case 'save': s.saves++; break
      case 'penalty_saved': s.saves++; s.penalties_saved++; break
    }
  }
  for (const a of collectAssists(events)) { const s = get(a.player_id); if (s) s.assists++ }
  for (const s of stats.values()) {
    s.rating = s.ratings.length ? Math.round((s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length) * 100) / 100 : 0
    const { xp, breakdown } = computeXP(s, data.xpRules.length ? data.xpRules : DEFAULT_XP_RULES)
    s.xp = xp; s.xp_breakdown = breakdown
  }
  if (scope.teamId) for (const [id, s] of stats) if (s.team_id !== scope.teamId) stats.delete(id)
  return stats
}

// ---------------------------------------------------------------------------
//  Classements individuels / courses aux trophées
// ---------------------------------------------------------------------------
export interface Ranked<T> { item: T; rank: number; previousRank?: number | null; delta?: number | null }

const nameKey = (data: LeagueData, id: string) => {
  const p = data.players.find((x) => x.id === id)
  return p ? `${p.last_name} ${p.first_name}` : id
}

type Cmp<T> = (a: T, b: T) => number
function rankList<T>(list: T[], cmp: Cmp<T>, sameKey: (x: T) => string): Ranked<T>[] {
  const sorted = [...list].sort(cmp)
  const out: Ranked<T>[] = []
  sorted.forEach((item, i) => {
    const prev = out[i - 1]
    const rank = prev && sameKey(prev.item) === sameKey(item) ? prev.rank : i + 1
    out.push({ item, rank })
  })
  return out
}

export const cmpXP = (data: LeagueData): Cmp<PlayerStats> => (a, b) =>
  b.xp - a.xp || b.goals - a.goals || b.assists - a.assists || a.played - b.played || nameKey(data, a.player_id).localeCompare(nameKey(data, b.player_id))
export const cmpScorer = (data: LeagueData): Cmp<PlayerStats> => (a, b) =>
  b.goals - a.goals || b.assists - a.assists || a.played - b.played || nameKey(data, a.player_id).localeCompare(nameKey(data, b.player_id))
export const cmpAssist = (data: LeagueData): Cmp<PlayerStats> => (a, b) =>
  b.assists - a.assists || b.goals - a.goals || a.played - b.played || nameKey(data, a.player_id).localeCompare(nameKey(data, b.player_id))
export const cmpKeeper = (data: LeagueData): Cmp<PlayerStats> => (a, b) =>
  b.xp - a.xp || b.clean_sheets - a.clean_sheets || b.saves - a.saves || a.goals_conceded - b.goals_conceded || nameKey(data, a.player_id).localeCompare(nameKey(data, b.player_id))
export const cmpRating = (data: LeagueData): Cmp<PlayerStats> => (a, b) =>
  b.rating - a.rating || b.xp - a.xp || b.played - a.played || nameKey(data, a.player_id).localeCompare(nameKey(data, b.player_id))

export type RaceKey = 'ballon_or' | 'golden_glove' | 'top_scorer' | 'top_assist' | 'xp'

export function race(data: LeagueData, stats: PlayerStats[], key: RaceKey): Ranked<PlayerStats>[] {
  switch (key) {
    case 'ballon_or': return rankList(stats.filter((s) => s.position !== 'GK' && s.played > 0), cmpXP(data), (s) => `${s.xp}|${s.goals}|${s.assists}|${s.played}`)
    case 'golden_glove': return rankList(stats.filter((s) => s.position === 'GK' && s.gk_matches > 0), cmpKeeper(data), (s) => `${s.xp}|${s.clean_sheets}|${s.saves}|${s.goals_conceded}`)
    case 'top_scorer': return rankList(stats.filter((s) => s.goals > 0), cmpScorer(data), (s) => `${s.goals}|${s.assists}|${s.played}`)
    case 'top_assist': return rankList(stats.filter((s) => s.assists > 0), cmpAssist(data), (s) => `${s.assists}|${s.goals}|${s.played}`)
    case 'xp': return rankList(stats.filter((s) => s.played > 0), cmpXP(data), (s) => `${s.xp}|${s.goals}|${s.assists}|${s.played}`)
  }
}

/** Dernière journée jouée dans le périmètre (clé saison#journée) */
export function lastRoundKey(data: LeagueData, scope: Scope = {}): string | null {
  const ms = playedMatches(data.matches, scope)
  if (!ms.length) return null
  return ms.map(roundKey).sort().at(-1)!
}

/** Course avec évolution ▲▼ : rang actuel vs rang sans la dernière journée jouée. */
export function raceWithEvolution(data: LeagueData, scope: Scope, key: RaceKey): Ranked<PlayerStats>[] {
  const current = race(data, [...computePlayerStats(data, scope).values()], key)
  const lrk = lastRoundKey(data, scope)
  if (!lrk) return current
  const prevStats = computePlayerStats(data, { ...scope, excludeRoundKey: lrk })
  const previous = race(data, [...prevStats.values()], key)
  const prevRank = new Map(previous.map((r) => [r.item.player_id, r.rank]))
  return current.map((r) => {
    const p = prevRank.get(r.item.player_id) ?? null
    return { ...r, previousRank: p, delta: p == null ? null : p - r.rank }
  })
}

// ---------------------------------------------------------------------------
//  Gardiens
// ---------------------------------------------------------------------------
export interface KeeperLine { player_id: string; team_id: string; matches: number; clean_sheets: number; saves: number; conceded: number; conceded_avg: number; xp: number }
export function keeperStats(data: LeagueData, scope: Scope = {}): KeeperLine[] {
  return [...computePlayerStats(data, scope).values()]
    .filter((s) => s.position === 'GK' && s.gk_matches > 0)
    .sort(cmpKeeper(data))
    .map((s) => ({
      player_id: s.player_id, team_id: s.team_id, matches: s.gk_matches, clean_sheets: s.clean_sheets, saves: s.saves,
      conceded: s.goals_conceded, conceded_avg: Math.round((s.goals_conceded / s.gk_matches) * 100) / 100, xp: s.xp,
    }))
}

// ---------------------------------------------------------------------------
//  Équipes
// ---------------------------------------------------------------------------
export interface TeamStats {
  team_id: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number
  points: number; clean_sheets: number; failed_to_score: number; yellow: number; red: number
  gf_avg: number; ga_avg: number; form: Result[]
  biggest_win?: Match; timeline: { label: string; points: number; gf: number; ga: number }[]
}
export function computeTeamStats(data: LeagueData, scope: Scope = {}): Map<string, TeamStats> {
  const ms = playedMatches(data.matches, { ...scope, teamId: undefined })
  const teamIds = scope.teamId ? [scope.teamId] : data.teams.map((t) => t.id)
  const table = computeTable(ms, teamIds, data.settings, data.events)
  const out = new Map<string, TeamStats>()
  const s = settingsWithDefaults(data.settings)
  for (const id of teamIds) {
    const r = table.get(id)!
    const mine = ms.filter((m) => m.home_team_id === id || m.away_team_id === id)
    let cs = 0, fts = 0, best: Match | undefined, bestDiff = 0, cum = 0
    const timeline: TeamStats['timeline'] = []
    for (const m of mine) {
      const home = m.home_team_id === id
      const gf = home ? m.home_score! : m.away_score!
      const ga = home ? m.away_score! : m.home_score!
      if (ga === 0) cs++
      if (gf === 0) fts++
      if (gf - ga > bestDiff) { bestDiff = gf - ga; best = m }
      cum += gf > ga ? s.points_win : gf === ga ? s.points_draw : s.points_loss
      timeline.push({ label: `J${m.round ?? timeline.length + 1}`, points: cum, gf, ga })
    }
    out.set(id, {
      team_id: id, played: r.played, won: r.won, drawn: r.drawn, lost: r.lost, gf: r.gf, ga: r.ga, gd: r.gd, points: r.points,
      clean_sheets: cs, failed_to_score: fts, yellow: r.yellow, red: r.red,
      gf_avg: r.played ? Math.round((r.gf / r.played) * 100) / 100 : 0,
      ga_avg: r.played ? Math.round((r.ga / r.played) * 100) / 100 : 0,
      form: r.results.slice(-5), biggest_win: best, timeline,
    })
  }
  return out
}

/** Meilleure défense : moins de buts encaissés par match (puis total, puis plus de matchs). Équipes à 0 MJ exclues. */
export function bestDefense(teamStats: TeamStats[]): TeamStats[] {
  return teamStats.filter((t) => t.played > 0).sort((a, b) => a.ga_avg - b.ga_avg || a.ga - b.ga || b.played - a.played || b.points - a.points)
}
/** Équipe la plus offensive : plus de buts marqués (puis moyenne). */
export function bestAttack(teamStats: TeamStats[]): TeamStats[] {
  return teamStats.filter((t) => t.played > 0).sort((a, b) => b.gf - a.gf || b.gf_avg - a.gf_avg || b.points - a.points)
}

/**
 * Meilleure équipe :
 *  - si une finale du périmètre est jouée → son vainqueur (champion) ;
 *  - sinon → 1er du classement de la compétition de plus haut niveau du périmètre ;
 *  - jamais une équipe sans match joué ni une équipe à 0 point. Retourne null si personne.
 */
export function bestTeam(data: LeagueData, scope: Scope = {}): { team_id: string; reason: 'champion' | 'leader'; row?: StandingRow; competition_id: string } | null {
  const comps = data.competitions
    .filter((c) => (!scope.seasonId || c.season_id === scope.seasonId) && (!scope.competitionId || c.id === scope.competitionId))
    .sort((a, b) => divisionLevel(data, a) - divisionLevel(data, b) || (a.order ?? 0) - (b.order ?? 0))
  for (const c of comps) {
    if (scope.phase !== 'league') {
      const final = data.matches.find((m) => m.competition_id === c.id && m.stage === 'final' && isPlayed(m))
      const w = final ? winnerOf(final) : null
      if (w) return { team_id: w, reason: 'champion', competition_id: c.id }
    }
    if (scope.phase === 'knockout') continue
    const table = competitionStandings(data, c.id)
    const leader = table.find((r) => r.played > 0 && r.points > 0)
    if (leader) return { team_id: leader.team_id, reason: 'leader', row: leader, competition_id: c.id }
  }
  return null
}

function divisionLevel(data: LeagueData, c: Competition) {
  return data.divisions?.find((d) => d.id === c.division_id)?.level ?? 99
}

// ---------------------------------------------------------------------------
//  Prix individuels (fin de saison)
// ---------------------------------------------------------------------------
export function ageAt(birth?: string, at?: string): number | null {
  if (!birth) return null
  const b = new Date(birth), d = at ? new Date(at) : new Date()
  let age = d.getFullYear() - b.getFullYear()
  const mo = d.getMonth() - b.getMonth()
  if (mo < 0 || (mo === 0 && d.getDate() < b.getDate())) age--
  return age
}

export interface AwardResult {
  category: AwardCategory
  player_id?: string
  team_id?: string
  value?: number
  not_awarded: boolean
  snapshot?: Record<string, unknown>
  top?: { player_id?: string; team_id?: string; value: number }[]
}

export const AWARD_LABELS: Record<AwardCategory, string> = {
  player_of_tournament: 'Joueur du tournoi',
  ballon_or: "Ballon d'or",
  top_scorer: "Soulier d'or",
  top_assist: 'Meilleur passeur',
  golden_glove: "Gant d'or",
  best_defender: 'Meilleur défenseur',
  best_midfielder: 'Meilleur milieu',
  best_forward: 'Meilleur attaquant',
  best_young: 'Meilleur jeune',
  best_team: 'Meilleure équipe',
  best_defense: 'Meilleure défense',
  best_attack: 'Équipe la plus offensive',
}

/** Génère tous les prix d'un périmètre (saison ± compétition). Utilisé par l'admin (génération) et le public (course). */
export function computeAwards(data: LeagueData, scope: Scope): AwardResult[] {
  const s = settingsWithDefaults(data.settings)
  const stats = [...computePlayerStats(data, scope).values()]
  const season = data.seasons.find((x) => x.id === scope.seasonId)
  const refDate = season?.start_date
  const minM = s.awards_min_matches
  const eligible = stats.filter((x) => x.played >= minM)
  const res: AwardResult[] = []
  const player = (category: AwardCategory, list: PlayerStats[], value: (x: PlayerStats) => number, extra?: (x: PlayerStats) => Record<string, unknown>) => {
    const w = list[0]
    res.push(w
      ? { category, player_id: w.player_id, team_id: w.team_id, value: value(w), not_awarded: false,
          snapshot: { played: w.played, goals: w.goals, assists: w.assists, xp: w.xp, rating: w.rating, ...(extra?.(w) ?? {}) },
          top: list.slice(0, 5).map((x) => ({ player_id: x.player_id, team_id: x.team_id, value: value(x) })) }
      : { category, not_awarded: true })
  }
  player('player_of_tournament', [...eligible].sort(cmpRating(data)), (x) => x.rating)
  player('ballon_or', race(data, stats, 'ballon_or').map((r) => r.item), (x) => x.xp)
  player('top_scorer', race(data, stats, 'top_scorer').map((r) => r.item), (x) => x.goals)
  player('top_assist', race(data, stats, 'top_assist').map((r) => r.item), (x) => x.assists)
  player('golden_glove', race(data, stats, 'golden_glove').map((r) => r.item), (x) => x.xp, (x) => ({ clean_sheets: x.clean_sheets, saves: x.saves, conceded: x.goals_conceded }))
  player('best_defender', eligible.filter((x) => x.position === 'DEF').sort(cmpRating(data)), (x) => x.rating)
  player('best_midfielder', eligible.filter((x) => x.position === 'MID').sort(cmpRating(data)), (x) => x.rating)
  player('best_forward', eligible.filter((x) => x.position === 'FWD').sort(cmpRating(data)), (x) => x.rating)
  player('best_young', eligible.filter((x) => {
    const p = data.players.find((pp) => pp.id === x.player_id)
    const age = ageAt(p?.birth_date, refDate)
    return age !== null && age < s.young_max_age
  }).sort(cmpRating(data)), (x) => x.rating)

  const bt = bestTeam(data, scope)
  res.push(bt ? { category: 'best_team', team_id: bt.team_id, value: bt.row?.points, not_awarded: false, snapshot: { reason: bt.reason, competition_id: bt.competition_id } } : { category: 'best_team', not_awarded: true })
  const ts = [...computeTeamStats(data, scope).values()]
  const scopedTeams = scopeTeamIds(data, scope)
  const tsScoped = ts.filter((t) => scopedTeams.has(t.team_id))
  const def = bestDefense(tsScoped)
  res.push(def[0] ? { category: 'best_defense', team_id: def[0].team_id, value: def[0].ga, not_awarded: false, snapshot: { ga: def[0].ga, played: def[0].played, ga_avg: def[0].ga_avg }, top: def.slice(0, 5).map((t) => ({ team_id: t.team_id, value: t.ga })) } : { category: 'best_defense', not_awarded: true })
  const att = bestAttack(tsScoped)
  res.push(att[0] ? { category: 'best_attack', team_id: att[0].team_id, value: att[0].gf, not_awarded: false, snapshot: { gf: att[0].gf, played: att[0].played, gf_avg: att[0].gf_avg }, top: att.slice(0, 5).map((t) => ({ team_id: t.team_id, value: t.gf })) } : { category: 'best_attack', not_awarded: true })
  return res
}

function scopeTeamIds(data: LeagueData, scope: Scope): Set<string> {
  const ids = new Set<string>()
  for (const m of filterMatches(data.matches, scope)) { ids.add(m.home_team_id); ids.add(m.away_team_id) }
  return ids
}

// ---------------------------------------------------------------------------
//  Équipe type de la journée (1 GB + 2 DEF + 2 MIL + 1 ATT par défaut)
// ---------------------------------------------------------------------------
export const TEAM_OF_ROUND_FORMATION: Position[] = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD']

export function teamOfRound(data: LeagueData, seasonId: string, round: number, competitionId?: string | null, formation: Position[] = TEAM_OF_ROUND_FORMATION) {
  const ms = playedMatches(data.matches, { seasonId, competitionId }).filter((m) => m.round === round)
  const lines = playerMatchLines(data, ms)
  const pool = [...lines.entries()].map(([pid, ls]) => {
    const p = data.players.find((x) => x.id === pid)!
    const best = ls.reduce((a, b) => (b.rating > a.rating ? b : a))
    return { player: p, line: best }
  }).filter((x) => x.player)
    .sort((a, b) => b.line.rating - a.line.rating || b.line.goals - a.line.goals || b.line.assists - a.line.assists)
  const used = new Set<string>()
  const slots: { player_id: string; position: Position; rating: number; team_id: string; goals: number; assists: number }[] = []
  for (const pos of formation) {
    let pick = pool.find((x) => !used.has(x.player.id) && x.player.position === pos && (pos !== 'GK' || x.line.is_goalkeeper))
    if (!pick && pos !== 'GK') pick = pool.find((x) => !used.has(x.player.id) && x.player.position !== 'GK')
    if (!pick) continue
    used.add(pick.player.id)
    slots.push({ player_id: pick.player.id, position: pos, rating: pick.line.rating, team_id: pick.line.team_id, goals: pick.line.goals, assists: pick.line.assists })
  }
  return slots
}

// ---------------------------------------------------------------------------
//  Confrontations directes
// ---------------------------------------------------------------------------
export function headToHead(matches: Match[], a: string, b: string) {
  const ms = matches.filter(isPlayed).filter((m) => (m.home_team_id === a && m.away_team_id === b) || (m.home_team_id === b && m.away_team_id === a)).sort(byDate)
  let aw = 0, bw = 0, d = 0, agf = 0, bgf = 0
  for (const m of ms) {
    const r = resultFor(m, a)
    if (r === 'W') aw++; else if (r === 'L') bw++; else d++
    agf += m.home_team_id === a ? m.home_score! : m.away_score!
    bgf += m.home_team_id === b ? m.home_score! : m.away_score!
  }
  return { matches: ms, aWins: aw, bWins: bw, draws: d, aGoals: agf, bGoals: bgf }
}

// ---------------------------------------------------------------------------
//  KPIs globaux
// ---------------------------------------------------------------------------
export function kpis(data: LeagueData, scope: Scope = {}) {
  const ms = playedMatches(data.matches, scope)
  const ids = new Set(ms.map((m) => m.id))
  const evs = data.events.filter((e) => ids.has(e.match_id))
  const goals = ms.reduce((a, m) => a + m.home_score! + m.away_score!, 0)
  return {
    matches: ms.length,
    goals,
    goals_avg: ms.length ? Math.round((goals / ms.length) * 100) / 100 : 0,
    assists: collectAssists(evs).length,
    yellow: evs.filter((e) => e.type === 'yellow_card').length,
    red: evs.filter((e) => e.type === 'red_card').length,
    saves: evs.filter((e) => e.type === 'save' || e.type === 'penalty_saved').length,
    clean_sheets: ms.reduce((a, m) => a + (m.home_score === 0 ? 1 : 0) + (m.away_score === 0 ? 1 : 0), 0),
  }
}

/** Buteurs d'un match regroupés par équipe bénéficiaire (CSC comptés pour l'adversaire) */
export function matchScorers(m: Match, events: MatchEvent[]) {
  const home: MatchEvent[] = [], away: MatchEvent[] = []
  for (const e of events.filter((x) => x.match_id === m.id).sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))) {
    if (e.type === 'goal' || e.type === 'penalty_goal') (e.team_id === m.home_team_id ? home : away).push(e)
    if (e.type === 'own_goal') (e.team_id === m.home_team_id ? away : home).push(e)
  }
  return { home, away }
}

/** Joueur recrue = une seule saison jouée */
export const isRookie = (p: Player) => (p.season_ids?.length ?? 0) <= 1

// ---------------------------------------------------------------------------
//  Votes homme du match
// ---------------------------------------------------------------------------
export function tallyVotes(votes: { player_id: string }[]) {
  const t = new Map<string, number>()
  for (const v of votes) t.set(v.player_id, (t.get(v.player_id) ?? 0) + 1)
  const total = votes.length
  return [...t.entries()].map(([player_id, count]) => ({ player_id, count, pct: total ? Math.round((count / total) * 100) : 0 })).sort((a, b) => b.count - a.count)
}

// ---------------------------------------------------------------------------
//  Promotions / relégations (clôture de saison)
// ---------------------------------------------------------------------------
export function computePromotions(data: LeagueData, seasonId: string) {
  const divs = [...(data.divisions ?? [])].sort((a, b) => a.level - b.level)
  const moves: { team_id: string; from_division_id: string; to_division_id: string; type: 'promotion' | 'relegation'; rank: number }[] = []
  const tables = new Map<string, StandingRow[]>()
  for (const d of divs) {
    const comp = data.competitions.find((c) => c.season_id === seasonId && c.division_id === d.id)
    if (comp) tables.set(d.id, competitionStandings(data, comp.id))
  }
  divs.forEach((d, i) => {
    const t = tables.get(d.id); if (!t) return
    const up = divs[i - 1], down = divs[i + 1]
    if (up && tables.has(up.id)) t.slice(0, d.promotion_count ?? 0).forEach((r) => moves.push({ team_id: r.team_id, from_division_id: d.id, to_division_id: up.id, type: 'promotion', rank: r.rank }))
    if (down && tables.has(down.id)) t.slice(Math.max(0, t.length - (d.relegation_count ?? 0))).forEach((r) => moves.push({ team_id: r.team_id, from_division_id: d.id, to_division_id: down.id, type: 'relegation', rank: r.rank }))
  })
  return { moves, tables }
}

// ---------------------------------------------------------------------------
export function groupBy<T, K>(arr: T[], key: (x: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>()
  for (const x of arr) { const k = key(x); if (!m.has(k)) m.set(k, []); m.get(k)!.push(x) }
  return m
}

// ---------------------------------------------------------------------------
//  Stats collectives d'un match depuis les événements du Match Center
//  ("Remplir depuis le Match Center" de la feuille de match)
//  Règle : un but ou un arrêt adverse = tir cadré (si non déjà saisi comme tir cadré auto).
// ---------------------------------------------------------------------------
export interface TeamMatchNumbers {
  goals: number; shots: number; shots_on_target: number; corners: number; fouls: number; offsides: number
  yellow_cards: number; red_cards: number; saves: number; throw_ins: number; free_kicks: number
}
export function teamStatsFromEvents(m: Pick<Match, 'home_team_id' | 'away_team_id'>, events: MatchEvent[], teamId: string, period?: '1H' | '2H'): TeamMatchNumbers {
  const opp = teamId === m.home_team_id ? m.away_team_id : m.home_team_id
  const evs = events.filter((e) => !period || e.period === period)
  const mine = evs.filter((e) => e.team_id === teamId)
  const c = (t: MatchEvent['type'], list = mine) => list.filter((e) => e.type === t).length
  const goals = c('goal') + c('penalty_goal') + evs.filter((e) => e.type === 'own_goal' && e.team_id === opp).length
  const autoOn = mine.filter((e) => e.type === 'shot_on_target' && e.auto).length
  const manualOn = c('shot_on_target') - autoOn
  // tirs cadrés = tirs cadrés saisis manuellement + buts (hors CSC) + arrêts du gardien adverse (+ penalty arrêté)
  const oppSaves = c('save', evs.filter((e) => e.team_id === opp)) + c('penalty_saved', evs.filter((e) => e.team_id === opp))
  const onTarget = manualOn + c('goal') + c('penalty_goal') + oppSaves
  return {
    goals, shots_on_target: onTarget, shots: onTarget + c('shot_off_target') + c('penalty_missed'),
    corners: c('corner'), fouls: c('foul'), offsides: c('offside'), yellow_cards: c('yellow_card'), red_cards: c('red_card'),
    saves: c('save') + c('penalty_saved'), throw_ins: c('throw_in'), free_kicks: c('free_kick'),
  }
}
