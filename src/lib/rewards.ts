// ============================================================================
//  Équipe type et récompenses (journée / mois / saison) — fonctions PURES.
//  Même source que l'XP et les badges : événements de match → journal des joueurs.
// ============================================================================
import type { Match, Position, TeamOfWeek } from '@/types/entities'
import { allPlayerLogs, type PlayerMatchLine } from './badges'
import { isPlayed } from './standings'
import { computePlayerXP, type PlayerXP, type XPData } from './xp'

// ---------------------------------------------------------------------------
//  Formations selon le nombre de joueurs sur le terrain
// ---------------------------------------------------------------------------
export interface Formation { label: string; lines: Position[][] }
/** Lignes du but vers l'attaque. Clé = joueurs sur le terrain (gardien compris). */
export const FORMATIONS: Record<number, Formation> = {
  5: { label: '2-1-1', lines: [['GK'], ['DEF', 'DEF'], ['MID'], ['FWD']] },
  6: { label: '2-2-1', lines: [['GK'], ['DEF', 'DEF'], ['MID', 'MID'], ['FWD']] },
  7: { label: '3-2-1', lines: [['GK'], ['DEF', 'DEF', 'DEF'], ['MID', 'MID'], ['FWD']] },
  8: { label: '3-3-1', lines: [['GK'], ['DEF', 'DEF', 'DEF'], ['MID', 'MID', 'MID'], ['FWD']] },
  11: { label: '4-3-3', lines: [['GK'], ['DEF', 'DEF', 'DEF', 'DEF'], ['MID', 'MID', 'MID'], ['FWD', 'FWD', 'FWD']] },
}
export const formationFor = (players = 6) => FORMATIONS[players] ?? FORMATIONS[Object.keys(FORMATIONS).map(Number).reduce((a, b) => (Math.abs(b - players) < Math.abs(a - players) ? b : a))]
/** Positions sur le terrain (en %), attaque en haut */
export function formationXY(f: Formation) {
  const out: { position: Position; x: number; y: number }[] = []
  const n = f.lines.length
  f.lines.forEach((line, i) => {
    const y = 88 - (i * 74) / Math.max(1, n - 1)
    line.forEach((position, j) => out.push({ position, x: ((j + 1) * 100) / (line.length + 1), y }))
  })
  return out
}

// ---------------------------------------------------------------------------
//  Périodes
// ---------------------------------------------------------------------------
export type Period = { type: 'round'; round: number } | { type: 'month'; month: string } | { type: 'season' }
export const inPeriod = (m: Match, p: Period) => p.type === 'season' || (p.type === 'round' ? (m.round ?? 0) === p.round : (m.date ?? '').startsWith(p.month))

export function periodMatches(data: Pick<XPData, 'matches'>, seasonId: string, p: Period, competitionId?: string | null) {
  return data.matches.filter((m) => m.season_id === seasonId && isPlayed(m) && inPeriod(m, p) && (!competitionId || m.competition_id === competitionId))
}
export const seasonRounds = (data: Pick<XPData, 'matches'>, seasonId: string, competitionId?: string | null) =>
  [...new Set(data.matches.filter((m) => m.season_id === seasonId && isPlayed(m) && (!competitionId || m.competition_id === competitionId)).map((m) => m.round ?? 0))].sort((a, b) => a - b)
export const seasonMonths = (data: Pick<XPData, 'matches'>, seasonId: string, competitionId?: string | null) =>
  [...new Set(data.matches.filter((m) => m.season_id === seasonId && isPlayed(m) && (!competitionId || m.competition_id === competitionId)).map((m) => (m.date ?? '').slice(0, 7)).filter(Boolean))].sort()

/** XP et stats sur une période (bonus mensuels et suspensions exclus : ce sont des récompenses, pas des performances) */
function periodXP(data: XPData, seasonId: string, matches: Match[]) {
  return computePlayerXP({ ...data, matches, suspensions: [], monthlyAwards: [] }, { seasonId })
}

// ---------------------------------------------------------------------------
//  Équipe type
// ---------------------------------------------------------------------------
export interface TeamOfWeekSlot { position: Position; player_id: string; team_id: string; rating: number; xp: number; goals: number; assists: number; saves: number; clean_sheet: boolean; x: number; y: number }
export interface TeamOfWeekResult { round: number; formation: Formation; slots: TeamOfWeekSlot[]; manual: boolean; player_of_round?: TeamOfWeekSlot }

interface Candidate { player_id: string; team_id: string; position: Position; rating: number; xp: number; goals: number; assists: number; saves: number; clean_sheet: boolean; keeper: boolean }

/**
 * Équipe type d'une journée : les meilleurs joueurs du poste selon la note du match
 * (buts, passes, arrêts, clean sheet, victoire, homme du match), départagés par l'XP du match.
 * Une sélection manuelle enregistrée dans l'admin (entité TeamOfWeek) est prioritaire.
 */
export function teamOfWeek(data: XPData, seasonId: string, round: number, opts: { competitionId?: string | null; players?: number; override?: TeamOfWeek | null; logs?: Map<string, PlayerMatchLine[]> } = {}): TeamOfWeekResult {
  const formation = opts.override?.formation ? (Object.values(FORMATIONS).find((f) => f.label === opts.override!.formation) ?? formationFor(opts.players)) : formationFor(opts.players)
  const ms = periodMatches(data, seasonId, { type: 'round', round }, opts.competitionId)
  const ids = new Set(ms.map((m) => m.id))
  const logs = opts.logs ?? allPlayerLogs(data, seasonId)
  const xp = periodXP(data, seasonId, ms)
  const pos = new Map(data.players.map((p) => [p.id, p.position]))
  const cands: Candidate[] = []
  for (const [pid, lines] of logs) {
    const l = lines.find((x) => ids.has(x.match.id)); if (!l) continue
    cands.push({ player_id: pid, team_id: l.team_id, position: pos.get(pid) ?? 'MID', rating: l.rating, xp: xp.get(pid)?.xp ?? 0, goals: l.goals, assists: l.assists, saves: l.saves, clean_sheet: l.clean_sheet, keeper: l.keeper })
  }
  cands.sort((a, b) => b.rating - a.rating || b.xp - a.xp || b.goals - a.goals || b.assists - a.assists)
  const byId = new Map(cands.map((c) => [c.player_id, c]))
  const xy = formationXY(formation)
  const used = new Set<string>()
  let manual = false
  const slots: TeamOfWeekSlot[] = []
  if (opts.override?.slots?.length) {
    manual = true
    opts.override.slots.forEach((s, i) => {
      const c = byId.get(s.player_id)
      const at = xy[i] ?? xy[xy.length - 1]
      used.add(s.player_id)
      slots.push({ position: s.position, player_id: s.player_id, team_id: c?.team_id ?? data.players.find((p) => p.id === s.player_id)?.team_id ?? '', rating: c?.rating ?? 0, xp: c?.xp ?? 0, goals: c?.goals ?? 0, assists: c?.assists ?? 0, saves: c?.saves ?? 0, clean_sheet: c?.clean_sheet ?? false, x: at.x, y: at.y })
    })
  } else {
    for (const at of xy) {
      let c = cands.find((x) => !used.has(x.player_id) && x.position === at.position && (at.position !== 'GK' || x.keeper))
      if (!c && at.position === 'GK') c = cands.find((x) => !used.has(x.player_id) && x.keeper)
      if (!c && at.position !== 'GK') c = cands.find((x) => !used.has(x.player_id) && x.position !== 'GK' && !x.keeper)
      if (!c) continue
      used.add(c.player_id)
      slots.push({ position: at.position, player_id: c.player_id, team_id: c.team_id, rating: c.rating, xp: c.xp, goals: c.goals, assists: c.assists, saves: c.saves, clean_sheet: c.clean_sheet, x: at.x, y: at.y })
    }
  }
  const best = [...slots].sort((a, b) => b.rating - a.rating || b.xp - a.xp)[0]
  return { round, formation, slots, manual, player_of_round: best }
}

// ---------------------------------------------------------------------------
//  Récompenses d'une période
// ---------------------------------------------------------------------------
export type RewardKey = 'best_player' | 'top_scorer' | 'top_assist' | 'best_keeper' | 'best_team'
export const REWARD_LABEL: Record<RewardKey, string> = { best_player: 'Meilleur joueur', top_scorer: 'Meilleur buteur', top_assist: 'Meilleur passeur', best_keeper: 'Gant d’or', best_team: 'Meilleure équipe' }
export const REWARD_ORDER: RewardKey[] = ['best_player', 'top_scorer', 'top_assist', 'best_keeper', 'best_team']

export interface Reward { key: RewardKey; player_id?: string; team_id?: string; value: number; unit: string; detail: string }

export function periodRewards(data: XPData, seasonId: string, p: Period, competitionId?: string | null): Reward[] {
  const ms = periodMatches(data, seasonId, p, competitionId)
  if (!ms.length) return []
  const x = [...periodXP(data, seasonId, ms).values()].filter((s) => s.matches > 0)
  const out: Reward[] = []
  const pl = (s: PlayerXP) => `${s.goals} but${s.goals > 1 ? 's' : ''}, ${s.assists} passe${s.assists > 1 ? 's' : ''} · ${s.matches} match${s.matches > 1 ? 's' : ''}`
  const best = [...x].sort((a, b) => b.xp - a.xp || b.goals - a.goals || b.assists - a.assists)[0]
  if (best) out.push({ key: 'best_player', player_id: best.player_id, team_id: best.team_id, value: best.xp, unit: 'XP', detail: pl(best) })
  const sc = [...x].filter((s) => s.goals > 0).sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.matches - b.matches)[0]
  if (sc) out.push({ key: 'top_scorer', player_id: sc.player_id, team_id: sc.team_id, value: sc.goals, unit: sc.goals > 1 ? 'buts' : 'but', detail: pl(sc) })
  const as = [...x].filter((s) => s.assists > 0).sort((a, b) => b.assists - a.assists || b.goals - a.goals || a.matches - b.matches)[0]
  if (as) out.push({ key: 'top_assist', player_id: as.player_id, team_id: as.team_id, value: as.assists, unit: as.assists > 1 ? 'passes' : 'passe', detail: pl(as) })
  const gk = [...x].filter((s) => s.gk_matches > 0).sort((a, b) => b.xp - a.xp || b.clean_sheets - a.clean_sheets || b.saves - a.saves || a.conceded - b.conceded)[0]
  if (gk) out.push({ key: 'best_keeper', player_id: gk.player_id, team_id: gk.team_id, value: gk.saves, unit: 'arrêts', detail: `${gk.clean_sheets} clean sheet${gk.clean_sheets > 1 ? 's' : ''}, ${gk.conceded} but${gk.conceded > 1 ? 's' : ''} encaissé${gk.conceded > 1 ? 's' : ''} · ${gk.xp} XP` })
  // meilleure équipe : points sur la période, puis différence de buts, puis buts marqués
  const pw = data.settings.points_win ?? 3, pd = data.settings.points_draw ?? 1, plz = data.settings.points_loss ?? 0
  const t = new Map<string, { pts: number; gf: number; ga: number; w: number; d: number; l: number }>()
  for (const m of ms) for (const home of [true, false]) {
    const id = home ? m.home_team_id : m.away_team_id
    const gf = home ? m.home_score! : m.away_score!, ga = home ? m.away_score! : m.home_score!
    const r = t.get(id) ?? { pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0 }
    r.gf += gf; r.ga += ga
    if (gf > ga) { r.pts += pw; r.w++ } else if (gf < ga) { r.pts += plz; r.l++ } else { r.pts += pd; r.d++ }
    t.set(id, r)
  }
  const bt = [...t.entries()].sort((a, b) => b[1].pts - a[1].pts || (b[1].gf - b[1].ga) - (a[1].gf - a[1].ga) || b[1].gf - a[1].gf)[0]
  if (bt && bt[1].pts > 0) out.push({ key: 'best_team', team_id: bt[0], value: bt[1].pts, unit: 'pts', detail: `${bt[1].w} V, ${bt[1].d} N, ${bt[1].l} D · ${bt[1].gf} buts marqués, ${bt[1].ga} encaissés` })
  return out
}
