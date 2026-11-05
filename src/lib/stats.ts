// ============================================================================
//  StatFoot — FAÇADE UNIQUE des calculs (site public, admin, Match Center, mode TV).
//  Classements : ./standings  ·  XP & trophées : ./xp  ·  Match en direct : ./matchEngine
// ============================================================================
import type { AwardCategory, Competition, Division, Group, Match, MatchEvent, Position } from '@/types/entities'
import { byDate, competitionStandings, isKnockout, isPlayed, winnerOf, type StandingRow } from './standings'
import { computePlayerXP, matchInScope, race, xpConfig, type PlayerXP, type XPData, type XPScope } from './xp'

export * from './standings'
export * from './xp'

export interface LeagueData extends XPData { divisions?: Division[]; groups?: Group[] }

// ---------------------------------------------------------------------------
//  Classement général de la saison (Gold devant Silver), et classement par périmètre
// ---------------------------------------------------------------------------
export function seasonCompetitions(data: Pick<LeagueData, 'competitions'>, seasonId?: string | null) {
  return data.competitions.filter((c) => !seasonId || c.season_id === seasonId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/**
 * Classement général : si les cups ont commencé (ou sont constituées), Gold Cup (1→10) puis Silver Cup (11→20) ;
 * sinon classement de la phase de ligue.
 */
export function generalStandings(data: LeagueData, seasonId: string): (StandingRow & { competition_id: string })[] {
  const comps = seasonCompetitions(data, seasonId)
  const gold = comps.find((c) => c.phase === 'gold'), silver = comps.find((c) => c.phase === 'silver')
  const lp = comps.find((c) => c.phase === 'league_phase')
  if (gold?.team_ids?.length && silver?.team_ids?.length) {
    const g = competitionStandings(data, gold.id).map((r) => ({ ...r, competition_id: gold.id }))
    const s = competitionStandings(data, silver.id).map((r) => ({ ...r, competition_id: silver.id, rank: r.rank + g.length }))
    return [...g, ...s]
  }
  const c = lp ?? comps[0]
  return c ? competitionStandings(data, c.id).map((r) => ({ ...r, competition_id: c.id })) : []
}

/**
 * Meilleure équipe :
 *  - vainqueur de la finale si une phase finale existe et est jouée ;
 *  - sinon 1er du classement du périmètre (général, phase de ligue, Gold ou Silver) ;
 *  - jamais une équipe sans match joué ou à 0 point → null = « Non attribué ».
 */
export function bestTeam(data: LeagueData, scope: XPScope): { team_id: string; reason: 'champion' | 'leader'; row?: StandingRow } | null {
  if (!scope.seasonId) return null
  const comps = seasonCompetitions(data, scope.seasonId)
  const phase = scope.phase ?? 'all'
  if (phase === 'all' || phase === 'gold' || phase === 'knockout') {
    const final = data.matches.find((m) => m.season_id === scope.seasonId && m.stage === 'final' && isPlayed(m) && (phase !== 'gold' || comps.find((c) => c.id === m.competition_id)?.phase !== 'silver'))
    const w = final ? winnerOf(final) : null
    if (w) return { team_id: w, reason: 'champion' }
  }
  let rows: StandingRow[] = []
  if (phase === 'all') rows = generalStandings(data, scope.seasonId)
  else {
    const c = comps.find((x) => x.phase === phase)
    if (c) rows = competitionStandings(data, c.id)
  }
  const leader = rows.find((r) => r.played > 0 && r.points > 0)
  return leader ? { team_id: leader.team_id, reason: 'leader', row: leader } : null
}

// ---------------------------------------------------------------------------
//  Équipes
// ---------------------------------------------------------------------------
export interface TeamStats {
  team_id: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; points: number
  clean_sheets: number; yellow: number; red: number; gf_avg: number; ga_avg: number
  timeline: { label: string; gf: number; ga: number; points: number }[]
}
export function computeTeamStats(data: LeagueData, scope: XPScope = {}): Map<string, TeamStats> {
  const comps = new Map(data.competitions.map((c) => [c.id, c]))
  const ms = data.matches.filter((m) => isPlayed(m) && matchInScope(m, comps, scope)).sort(byDate)
  const out = new Map<string, TeamStats>()
  const get = (id: string) => {
    if (!out.has(id)) out.set(id, { team_id: id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, clean_sheets: 0, yellow: 0, red: 0, gf_avg: 0, ga_avg: 0, timeline: [] })
    return out.get(id)!
  }
  const pw = data.settings.points_win ?? 3, pd = data.settings.points_draw ?? 1, pl = data.settings.points_loss ?? 0
  for (const m of ms) {
    for (const home of [true, false]) {
      const t = get(home ? m.home_team_id : m.away_team_id)
      const gf = home ? m.home_score! : m.away_score!, ga = home ? m.away_score! : m.home_score!
      t.played++; t.gf += gf; t.ga += ga
      if (gf > ga) { t.won++; t.points += pw } else if (gf < ga) { t.lost++; t.points += pl } else { t.drawn++; t.points += pd }
      if (ga === 0) t.clean_sheets++
      t.timeline.push({ label: `J${m.round}`, gf, ga, points: t.points })
    }
  }
  const ids = new Set(ms.map((m) => m.id))
  for (const e of data.events) {
    if (!ids.has(e.match_id)) continue
    const t = out.get(e.team_id); if (!t) continue
    if (e.type === 'yellow_card' || e.type === 'second_yellow') t.yellow++
    if (e.type === 'red_card' || e.type === 'second_yellow') t.red++
  }
  for (const t of out.values()) { t.gd = t.gf - t.ga; t.gf_avg = t.played ? +(t.gf / t.played).toFixed(2) : 0; t.ga_avg = t.played ? +(t.ga / t.played).toFixed(2) : 0 }
  return out
}
export const bestDefense = (ts: TeamStats[]) => ts.filter((t) => t.played > 0).sort((a, b) => a.ga_avg - b.ga_avg || a.ga - b.ga || b.points - a.points)
export const bestAttack = (ts: TeamStats[]) => ts.filter((t) => t.played > 0).sort((a, b) => b.gf - a.gf || b.gf_avg - a.gf_avg || b.points - a.points)

// ---------------------------------------------------------------------------
//  KPIs
// ---------------------------------------------------------------------------
export function kpis(data: LeagueData, scope: XPScope = {}) {
  const comps = new Map(data.competitions.map((c) => [c.id, c]))
  const ms = data.matches.filter((m) => isPlayed(m) && matchInScope(m, comps, scope))
  const ids = new Set(ms.map((m) => m.id))
  const evs = data.events.filter((e) => ids.has(e.match_id))
  const goals = ms.reduce((a, m) => a + m.home_score! + m.away_score!, 0)
  return {
    matches: ms.length, goals, goals_avg: ms.length ? +(goals / ms.length).toFixed(2) : 0,
    assists: evs.filter((e) => e.type === 'goal' && e.related_player_id).length,
    yellow: evs.filter((e) => e.type === 'yellow_card' || e.type === 'second_yellow').length,
    red: evs.filter((e) => e.type === 'red_card' || e.type === 'second_yellow').length,
    saves: evs.filter((e) => e.type === 'save' || e.type === 'penalty_saved').length,
    clean_sheets: ms.reduce((a, m) => a + (m.home_score === 0 ? 1 : 0) + (m.away_score === 0 ? 1 : 0), 0),
  }
}

// ---------------------------------------------------------------------------
//  Trophées de fin de saison
// ---------------------------------------------------------------------------
export const AWARD_LABELS: Record<AwardCategory, string> = {
  ballon_or: "Ballon d'or", golden_glove: "Gant d'or", top_scorer: "Soulier d'or", top_assist: 'Meilleur passeur', best_team: 'Meilleure équipe',
  player_of_tournament: 'Joueur du tournoi',
  best_young: 'Meilleur jeune', best_defense: 'Meilleure défense', best_attack: 'Équipe la plus offensive',
}
export interface AwardResult { category: AwardCategory; player_id?: string; team_id?: string; value?: number; not_awarded: boolean; snapshot?: Record<string, unknown> }

export function ageAt(birth?: string, at?: string): number | null {
  if (!birth) return null
  const b = new Date(birth), d = at ? new Date(at) : new Date()
  let a = d.getFullYear() - b.getFullYear()
  if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) a--
  return a
}

export function computeAwards(data: LeagueData, scope: XPScope): AwardResult[] {
  const list = [...computePlayerXP(data, scope).values()]
  const cfg = xpConfig(data.xpRules, scope.seasonId)
  const season = data.seasons.find((s) => s.id === scope.seasonId)
  const youngMax = data.settings.young_max_age ?? 23
  const eligible = list.filter((s) => s.matches >= cfg.min_matches_awards).sort((a, b) => b.xp - a.xp || b.goals - a.goals || b.assists - a.assists || a.matches - b.matches)
  const res: AwardResult[] = []
  const snap = (s: PlayerXP) => ({ matches: s.matches, goals: s.goals, assists: s.assists, xp: s.xp, clean_sheets: s.clean_sheets, saves: s.saves, conceded: s.conceded })
  const push = (category: AwardCategory, w: PlayerXP | undefined, value: (s: PlayerXP) => number) =>
    res.push(w ? { category, player_id: w.player_id, team_id: w.team_id, value: value(w), not_awarded: false, snapshot: snap(w) } : { category, not_awarded: true })
  push('ballon_or', race(data, list, 'ballon_or', scope.seasonId)[0]?.item, (s) => s.xp)
  push('golden_glove', race(data, list, 'golden_glove', scope.seasonId)[0]?.item, (s) => s.xp)
  push('top_scorer', race(data, list, 'top_scorer', scope.seasonId)[0]?.item, (s) => s.goals)
  push('top_assist', race(data, list, 'top_assist', scope.seasonId)[0]?.item, (s) => s.assists)
  push('player_of_tournament', eligible[0], (s) => s.xp)
  push('best_young', eligible.find((s) => { const p = data.players.find((x) => x.id === s.player_id); const a = ageAt(p?.birth_date, season?.start_date); return a !== null && a < youngMax }), (s) => s.xp)
  const bt = bestTeam(data, scope)
  res.push(bt ? { category: 'best_team', team_id: bt.team_id, value: bt.row?.points, not_awarded: false, snapshot: { reason: bt.reason } } : { category: 'best_team', not_awarded: true })
  const ts = [...computeTeamStats(data, scope).values()]
  const d = bestDefense(ts)[0], a = bestAttack(ts)[0]
  res.push(d ? { category: 'best_defense', team_id: d.team_id, value: d.ga, not_awarded: false, snapshot: { ga: d.ga, played: d.played, ga_avg: d.ga_avg } } : { category: 'best_defense', not_awarded: true })
  res.push(a ? { category: 'best_attack', team_id: a.team_id, value: a.gf, not_awarded: false, snapshot: { gf: a.gf, played: a.played } } : { category: 'best_attack', not_awarded: true })
  return res
}

// ---------------------------------------------------------------------------
//  Équipe type de la journée (6 contre 6) : le meilleur gardien + les 5 meilleurs joueurs de champ à l'XP
// ---------------------------------------------------------------------------
export const TEAM_OF_ROUND_FORMATION: Position[] = ['GK', 'FIELD', 'FIELD', 'FIELD', 'FIELD', 'FIELD']
export function teamOfRound(data: LeagueData, seasonId: string, round: number) {
  const ms = data.matches.filter((m) => m.season_id === seasonId && m.round === round && isPlayed(m))
  const ids = new Set(ms.map((m) => m.id))
  const sub: LeagueData = { ...data, matches: ms, suspensions: [], monthlyAwards: [], events: data.events.filter((e) => ids.has(e.match_id)) }
  const list = [...computePlayerXP(sub, { seasonId }).values()].filter((s) => s.matches > 0).sort((a, b) => b.xp - a.xp || b.goals - a.goals || b.assists - a.assists)
  const used = new Set<string>()
  const slots: { player_id: string; position: Position; xp: number; team_id: string; goals: number; assists: number }[] = []
  for (const pos of TEAM_OF_ROUND_FORMATION) {
    let pick = list.find((s) => !used.has(s.player_id) && s.position === pos && (pos !== 'GK' || s.gk_matches > 0))
    if (!pick && pos !== 'GK') pick = list.find((s) => !used.has(s.player_id) && s.position !== 'GK')
    if (!pick) continue
    used.add(pick.player_id)
    slots.push({ player_id: pick.player_id, position: pos, xp: pick.xp, team_id: pick.team_id, goals: pick.goals, assists: pick.assists })
  }
  return slots
}

// ---------------------------------------------------------------------------
//  Divers
// ---------------------------------------------------------------------------
export function matchScorers(m: Match, events: MatchEvent[]) {
  const home: MatchEvent[] = [], away: MatchEvent[] = []
  for (const e of events.filter((x) => x.match_id === m.id).sort((a, b) => ['1H', '2H', 'ET1', 'ET2'].indexOf(a.period ?? '1H') - ['1H', '2H', 'ET1', 'ET2'].indexOf(b.period ?? '1H') || (a.minute ?? 0) - (b.minute ?? 0))) {
    if (e.type === 'goal') (e.team_id === m.home_team_id ? home : away).push(e)
    if (e.type === 'own_goal') (e.team_id === m.home_team_id ? away : home).push(e)
  }
  return { home, away }
}

export function tallyVotes(votes: { player_id: string }[]) {
  const t = new Map<string, number>()
  for (const v of votes) t.set(v.player_id, (t.get(v.player_id) ?? 0) + 1)
  return [...t.entries()].map(([player_id, count]) => ({ player_id, count, pct: votes.length ? Math.round((count / votes.length) * 100) : 0 })).sort((a, b) => b.count - a.count)
}

export function competitionLabel(c?: Competition) { return c?.name ?? '' }
export { isKnockout }
