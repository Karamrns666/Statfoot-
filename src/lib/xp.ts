// ============================================================================
//  XP — barème MBL. Fonctions PURES, recalcul intégral depuis les événements de match.
//  Source unique pour : fiche joueur, Trophées, accueil (podium, top gardiens), admin, Match Center (XP en direct).
// ============================================================================
import { phaseName } from './competitionNames'
import type {
  Competition, Lineup, Match, MatchEvent, MonthlyAward, Player, Season, Settings, Suspension, Team, XPKey, XPRule,
} from '@/types/entities'
import { competitionStandings, isKnockout, isPlayed } from './standings'
import { keeperMatchStats, participants } from './matchEngine'
import { addShots, emptyShots, playerMatchShots, type ShotTotals } from './shots'
import { SUSPENSION_LABEL, suspensionKind } from './reglement'

// ---------------------------------------------------------------------------
//  Barème
// ---------------------------------------------------------------------------
export const XP_DEFAULTS: Record<XPKey, number> = {
  goal: 50, assist: 20,
  mult_top3: 2, mult_4_6: 1.5, mult_7plus: 1,
  win: 50, loss: -50,
  yellow: -20, double_yellow_total: -40, red_direct: -50, per_suspension_match: -50,
  clean_sheet_gk: 50, save: 5, penalty_saved: 30, shootout_saved: 20, goal_conceded_gk: -10,
  motm: 70,
  player_of_month: 100, team_of_month: 50, goal_of_month: 50,
  min_matches_awards: 1,
  // ⚠️ Coefficients d'importance (clean sheet × importance) : valeurs à confirmer par la ligue → neutres (×1) par défaut.
  importance_league_phase: 1, importance_gold: 1, importance_silver: 1, importance_knockout: 1,
}

export const XP_LABELS: Record<XPKey, string> = {
  goal: 'But', assist: 'Passe décisive',
  mult_top3: 'Multiplicateur adversaire classé 1er–3e', mult_4_6: 'Multiplicateur adversaire classé 4e–6e', mult_7plus: 'Multiplicateur adversaire classé 7e et +',
  win: 'Victoire', loss: 'Défaite', yellow: 'Carton jaune', double_yellow_total: '2 jaunes même match (total)', red_direct: 'Carton rouge direct',
  per_suspension_match: 'Par match de suspension', clean_sheet_gk: 'Clean sheet gardien (× importance)', save: 'Arrêt', penalty_saved: 'Penalty arrêté',
  shootout_saved: 'Tir au but arrêté', goal_conceded_gk: 'But encaissé (gardien)', motm: 'Homme du match', player_of_month: 'Joueur du mois', team_of_month: 'Équipe du mois',
  goal_of_month: 'But du mois', min_matches_awards: "Matchs minimum (Ballon d'or / Gant d'or)",
  importance_league_phase: 'Importance — phase de ligue', get importance_gold() { return `Importance — ${phaseName('gold')}` }, get importance_silver() { return `Importance — ${phaseName('silver')}` }, importance_knockout: 'Importance — phases finales',
}
export const XP_KEYS = Object.keys(XP_DEFAULTS) as XPKey[]
export const MULTIPLIER_KEYS: XPKey[] = ['mult_top3', 'mult_4_6', 'mult_7plus', 'importance_league_phase', 'importance_gold', 'importance_silver', 'importance_knockout', 'min_matches_awards']

export type XPConfig = Record<XPKey, number>
export function xpConfig(rules: XPRule[], seasonId?: string | null): XPConfig {
  const cfg = { ...XP_DEFAULTS }
  for (const r of rules) if (!seasonId || r.season_id === seasonId) cfg[r.key] = r.value
  return cfg
}

/** Multiplicateur selon le rang de l'adversaire avant le match (null = pas encore de classement → ×1). */
export function opponentMultiplier(rank: number | null | undefined, cfg: XPConfig) {
  if (!rank) return 1
  if (rank <= 3) return cfg.mult_top3
  if (rank <= 6) return cfg.mult_4_6
  return cfg.mult_7plus
}

export function importanceOf(match: Pick<Match, 'stage'>, comp: Pick<Competition, 'phase'> | undefined, cfg: XPConfig) {
  if (isKnockout(match) || comp?.phase === 'knockout') return cfg.importance_knockout
  if (comp?.phase === 'gold') return cfg.importance_gold
  if (comp?.phase === 'silver') return cfg.importance_silver
  return cfg.importance_league_phase
}

// ---------------------------------------------------------------------------
//  Données
// ---------------------------------------------------------------------------
export interface XPData {
  seasons: Season[]
  competitions: Competition[]
  teams: Team[]
  players: Player[]
  matches: Match[]
  events: MatchEvent[]
  lineups: Lineup[]
  xpRules: XPRule[]
  suspensions: Suspension[]
  monthlyAwards: MonthlyAward[]
  settings: Partial<Settings>
}

export type PhaseFilter = 'all' | 'league_phase' | 'gold' | 'silver' | 'knockout'
export interface XPScope {
  seasonId?: string | null
  phase?: PhaseFilter
  competitionId?: string | null
  /** plusieurs compétitions (ex. MASTER = pré-saison + MASTER : les stats de la pré-saison comptent) */
  competitionIds?: string[] | null
  /** joueurs de ces équipes uniquement (ex. équipes de la division MASTER) */
  teamIds?: string[] | null
  /** exclut tout ce qui est >= cette clé "saison#journée" (calcul du rang à la journée précédente) */
  excludeFromRoundKey?: string | null
}

export const roundKey = (m: Pick<Match, 'season_id' | 'round'>) => `${m.season_id}#${String(m.round ?? 0).padStart(3, '0')}`

export function matchInScope(m: Match, comps: Map<string, Competition>, s: XPScope) {
  if (s.seasonId && m.season_id !== s.seasonId) return false
  if (s.competitionId && m.competition_id !== s.competitionId) return false
  if (s.competitionIds && !s.competitionIds.includes(m.competition_id)) return false
  const phase = s.phase ?? 'all'
  if (phase !== 'all') {
    const c = comps.get(m.competition_id)
    if (phase === 'knockout') { if (!isKnockout(m) && c?.phase !== 'knockout') return false }
    else if (isKnockout(m) || c?.phase !== phase) return false
  }
  if (s.excludeFromRoundKey) {
    const [sid] = s.excludeFromRoundKey.split('#')
    if (m.season_id === sid && roundKey(m) >= s.excludeFromRoundKey) return false
  }
  return true
}

// ---------------------------------------------------------------------------
//  Rang de l'adversaire au moment du match
// ---------------------------------------------------------------------------
/**
 * Rang d'une équipe AVANT la journée du match, dans le classement de la compétition du match :
 *  - phase de ligue, J1 (aucun match joué) → null (multiplicateur ×1) ;
 *  - cup (Gold/Silver) sans match joué → ordre d'entrée dans la cup (= classement de la phase de ligue) ;
 *  - phase finale → rang final de l'équipe dans sa cup.
 * Si le match est validé, le rang figé dans `opponent_rank_snapshot` fait foi.
 */
export function teamRankBefore(data: Pick<XPData, 'competitions' | 'matches' | 'events' | 'settings' | 'teams'>, match: Match, teamId: string, cache = new Map<string, Map<string, number>>()): number | null {
  const snap = match.opponent_rank_snapshot
  if (match.validated && snap) {
    const v = teamId === match.home_team_id ? snap.home_rank : snap.away_rank
    if (v !== undefined) return v
  }
  let comp = data.competitions.find((c) => c.id === match.competition_id)
  let before: number | undefined = match.round
  if (isKnockout(match) || comp?.phase === 'knockout') {
    comp = data.competitions.find((c) => c.season_id === match.season_id && c.phase !== 'knockout' && c.phase !== 'league_phase' && c.team_ids?.includes(teamId))
      ?? data.competitions.find((c) => c.season_id === match.season_id && c.phase === 'league_phase' && c.team_ids?.includes(teamId))
    before = undefined
  }
  if (!comp) return null
  const key = `${comp.id}|${before ?? 'final'}`
  if (!cache.has(key)) {
    const playedBefore = data.matches.some((m) => m.competition_id === comp!.id && !isKnockout(m) && isPlayed(m) && (before == null || (m.round ?? 0) < before))
    let ranks: Map<string, number>
    if (!playedBefore) {
      ranks = comp.phase === 'league_phase' ? new Map() : new Map((comp.team_ids ?? []).map((id, i) => [id, i + 1]))
    } else {
      ranks = new Map(competitionStandings(data, comp.id, { beforeRound: before }).map((r) => [r.team_id, r.rank]))
    }
    cache.set(key, ranks)
  }
  return cache.get(key)!.get(teamId) ?? null
}

// ---------------------------------------------------------------------------
//  Lignes d'XP
// ---------------------------------------------------------------------------
export type XPLineKey = XPKey | 'double_yellow'
export interface XPLine {
  player_id: string
  match_id?: string
  round_key?: string | null
  key: XPKey
  label: string
  count: number
  base: number
  mult: number
  points: number
  detail?: string
}

const line = (player_id: string, key: XPKey, cfg: XPConfig, count: number, mult: number, extra: Partial<XPLine> = {}): XPLine => ({
  player_id, key, label: XP_LABELS[key], count, base: cfg[key], mult, points: Math.round(count * cfg[key] * mult), ...extra,
})

/**
 * Lignes d'XP d'un match. Ordre d'application retenu (paramétrable, à confirmer par la ligue) :
 *   but / passe          = valeur × multiplicateur adversaire
 *   clean sheet gardien  = valeur × importance du match
 *   autres actions       = valeur (sans multiplicateur)
 *   arrondi à l'entier sur chaque ligne.
 * `score` permet le calcul en direct (match non clôturé).
 */
export function matchXPLines(data: XPData, match: Match, cfg: XPConfig, opts: { rankCache?: Map<string, Map<string, number>>; score?: { home: number; away: number } } = {}): XPLine[] {
  const out: XPLine[] = []
  const evs = data.events.filter((e) => e.match_id === match.id)
  const rk = roundKey(match)
  const comp = data.competitions.find((c) => c.id === match.competition_id)
  const hs = opts.score?.home ?? match.home_score ?? 0, as = opts.score?.away ?? match.away_score ?? 0
  const cache = opts.rankCache ?? new Map()
  const multFor = (teamId: string) => {
    const opp = teamId === match.home_team_id ? match.away_team_id : match.home_team_id
    const r = teamRankBefore(data, match, opp, cache)
    return { mult: opponentMultiplier(r, cfg), rank: r }
  }
  const base = { match_id: match.id, round_key: rk }
  for (const teamId of [match.home_team_id, match.away_team_id]) {
    const lu = data.lineups.find((l) => l.match_id === match.id && l.team_id === teamId)
    let ps = participants(lu, evs, teamId)
    if (ps.size === 0) ps = new Set(evs.filter((e) => e.team_id === teamId).flatMap((e) => [e.player_id, e.type === 'goal' ? e.related_player_id : undefined]).filter(Boolean) as string[])
    const gf = teamId === match.home_team_id ? hs : as, ga = teamId === match.home_team_id ? as : hs
    const { mult, rank } = multFor(teamId)
    const rankTxt = rank ? `adversaire ${rank}e` : 'adversaire non classé'
    for (const pid of ps) {
      if (gf > ga) out.push(line(pid, 'win', cfg, 1, 1, base))
      else if (gf < ga) out.push(line(pid, 'loss', cfg, 1, 1, base))
    }
    const mine = evs.filter((e) => e.team_id === teamId)
    const goals = new Map<string, number>(), assists = new Map<string, number>()
    for (const e of mine) {
      if (e.type !== 'goal') continue
      if (e.player_id) goals.set(e.player_id, (goals.get(e.player_id) ?? 0) + 1)
      if (e.related_player_id && e.related_player_id !== e.player_id) assists.set(e.related_player_id, (assists.get(e.related_player_id) ?? 0) + 1)
    }
    for (const [pid, n] of goals) out.push(line(pid, 'goal', cfg, n, mult, { ...base, detail: `×${mult} (${rankTxt})` }))
    for (const [pid, n] of assists) out.push(line(pid, 'assist', cfg, n, mult, { ...base, detail: `×${mult} (${rankTxt})` }))
    // cartons
    const byPlayer = new Map<string, MatchEvent[]>()
    for (const e of mine) if (e.player_id && (e.type === 'yellow_card' || e.type === 'second_yellow' || e.type === 'red_card')) {
      if (!byPlayer.has(e.player_id)) byPlayer.set(e.player_id, []); byPlayer.get(e.player_id)!.push(e)
    }
    for (const [pid, cards] of byPlayer) {
      const second = cards.some((c) => c.type === 'second_yellow')
      const yellows = cards.filter((c) => c.type === 'yellow_card').length
      if (second) out.push(line(pid, 'double_yellow_total', cfg, 1, 1, base))
      else if (yellows) out.push(line(pid, 'yellow', cfg, yellows, 1, base))
      const reds = cards.filter((c) => c.type === 'red_card').length
      if (reds) out.push(line(pid, 'red_direct', cfg, reds, 1, base))
    }
    // gardien(s)
    const imp = importanceOf(match, comp, cfg)
    for (const k of keeperMatchStats(match, lu, evs, teamId)) {
      if (k.clean_sheet) out.push(line(k.player_id, 'clean_sheet_gk', cfg, 1, imp, { ...base, detail: `× importance ${imp}` }))
      if (k.saves) out.push(line(k.player_id, 'save', cfg, k.saves, 1, base))
      if (k.penalties_saved) out.push(line(k.player_id, 'penalty_saved', cfg, k.penalties_saved, 1, base))
      if (k.shootout_saved) out.push(line(k.player_id, 'shootout_saved', cfg, k.shootout_saved, 1, base))
      if (k.conceded) out.push(line(k.player_id, 'goal_conceded_gk', cfg, k.conceded, 1, base))
    }
  }
  // homme du match (désigné à la fin du match : admin ou vote du public)
  if (match.motm_player_id) out.push(line(match.motm_player_id, 'motm', cfg, 1, 1, base))
  return out.filter((l) => l.points !== 0 || l.key === 'clean_sheet_gk')
}

// ---------------------------------------------------------------------------
//  Exemples chiffrés — calculés par le MÊME moteur (matchXPLines) avec le barème en vigueur
// ---------------------------------------------------------------------------
export interface XPExample { title: string; context: string; lines: XPLine[]; total: number }

/** Deux matchs fictifs passés dans le vrai calcul : un joueur de champ et un gardien. */
export function xpExamples(cfg: XPConfig): XPExample[] {
  const comp = { id: 'ex_c', season_id: 'ex', name: 'Exemple', phase: 'league_phase' } as Competition
  const run = (id: string, score: [number, number], oppRank: number, evs: Omit<MatchEvent, 'id' | 'match_id'>[], lineup: Omit<Lineup, 'id' | 'match_id'>) => {
    const match = { id, season_id: 'ex', competition_id: comp.id, round: 5, stage: 'league_phase', status: 'finished', home_team_id: 'A', away_team_id: 'B', home_score: score[0], away_score: score[1], validated: true, opponent_rank_snapshot: { home_rank: 1, away_rank: oppRank } } as unknown as Match
    const data: XPData = { seasons: [], competitions: [comp], teams: [], players: [], matches: [match], events: evs.map((e, i) => ({ ...e, id: `${id}_${i}`, match_id: id }) as MatchEvent), lineups: [{ ...lineup, id: `${id}_lu`, match_id: id } as Lineup], xpRules: [], suspensions: [], monthlyAwards: [], settings: {} }
    return matchXPLines(data, match, cfg)
  }
  const sum = (ls: XPLine[]) => ls.reduce((a, l) => a + l.points, 0)
  const field = run('ex1', [3, 1], 2, [
    { team_id: 'A', type: 'goal', player_id: 'P', related_player_id: 'Q' },
    { team_id: 'A', type: 'goal', player_id: 'P' },
    { team_id: 'A', type: 'goal', player_id: 'Q', related_player_id: 'P' },
    { team_id: 'A', type: 'yellow_card', player_id: 'P' },
    { team_id: 'B', type: 'goal', player_id: 'X' },
  ], { team_id: 'A', starter_ids: ['K', 'P', 'Q'], goalkeeper_id: 'K' }).filter((l) => l.player_id === 'P')
  const keeper = run('ex2', [2, 0], 8, [
    { team_id: 'A', type: 'goal', player_id: 'P' }, { team_id: 'A', type: 'goal', player_id: 'Q' },
    ...Array.from({ length: 6 }, () => ({ team_id: 'A', type: 'save' as const, player_id: 'K' })),
  ], { team_id: 'A', starter_ids: ['K', 'P', 'Q'], goalkeeper_id: 'K' }).filter((l) => l.player_id === 'K')
  return [
    { title: 'Un joueur de champ', context: 'Victoire 3-1 contre l’équipe classée 2e : 2 buts, 1 passe décisive, 1 carton jaune.', lines: field, total: sum(field) },
    { title: 'Un gardien', context: 'Victoire 2-0 contre l’équipe classée 8e : 6 arrêts, aucun but encaissé.', lines: keeper, total: sum(keeper) },
  ]
}

/**
 * Suspensions comptées dans l'XP (« par match de suspension ») : chaque ligne Suspension —
 * décision du conseil de discipline (v8, Art. 19) ou suspension saisie à la main (anciennes saisons).
 * Pas de suspension automatique : un carton rouge seul ne coûte que son malus de carton.
 */
export function xpSuspensions(data: Pick<XPData, 'suspensions'>) {
  return data.suspensions.filter((s) => s.matches > 0).map((s) => ({ season_id: s.season_id, player_id: s.player_id, origin_match_id: s.origin_match_id, matches: s.matches, label: SUSPENSION_LABEL[suspensionKind(s)] }))
}

/** Lignes hors match : suspensions et récompenses mensuelles. */
export function seasonXPLines(data: XPData, seasonId: string | null | undefined, cfg: XPConfig, comps: Map<string, Competition>, scope: XPScope): XPLine[] {
  const out: XPLine[] = []
  const matchById = new Map(data.matches.map((m) => [m.id, m]))
  for (const s of xpSuspensions(data)) {
    if (seasonId && s.season_id !== seasonId) continue
    const om = s.origin_match_id ? matchById.get(s.origin_match_id) : undefined
    if (om && !matchInScope(om, comps, { ...scope, excludeFromRoundKey: null })) continue
    if (!om && scope.phase && scope.phase !== 'all') continue
    const rk = om ? roundKey(om) : null
    if (scope.excludeFromRoundKey && rk && rk >= scope.excludeFromRoundKey) continue
    out.push(line(s.player_id, 'per_suspension_match', cfg, s.matches, 1, { match_id: om?.id, round_key: rk, detail: s.label ? `${s.label} · ${s.matches} match(s)` : `${s.matches} match(s)` }))
  }
  if (scope.phase && scope.phase !== 'all') return out
  for (const a of data.monthlyAwards) {
    if (seasonId && a.season_id !== seasonId) continue
    const inMonth = data.matches.filter((m) => m.season_id === a.season_id && isPlayed(m) && (m.date ?? '').startsWith(a.month))
    const rk = inMonth.length ? inMonth.map(roundKey).sort().at(-1)! : null
    if (scope.excludeFromRoundKey && rk && rk >= scope.excludeFromRoundKey) continue
    const detail = `Mois ${a.month}`
    if (a.type === 'player' && a.player_id) out.push(line(a.player_id, 'player_of_month', cfg, 1, 1, { round_key: rk, detail }))
    if (a.type === 'goal') {
      const ev = data.events.find((e) => e.id === a.event_id)
      const pid = ev?.player_id ?? a.player_id
      if (pid) out.push(line(pid, 'goal_of_month', cfg, 1, 1, { round_key: rk, match_id: ev?.match_id, detail }))
    }
    if (a.type === 'team' && a.team_id) {
      // bonus aux joueurs de l'équipe ayant joué au moins un match ce mois-ci
      const played = new Set<string>()
      for (const m of inMonth.filter((x) => x.home_team_id === a.team_id || x.away_team_id === a.team_id)) {
        const lu = data.lineups.find((l) => l.match_id === m.id && l.team_id === a.team_id)
        for (const p of participants(lu, data.events.filter((e) => e.match_id === m.id), a.team_id!)) played.add(p)
      }
      for (const pid of played) out.push(line(pid, 'team_of_month', cfg, 1, 1, { round_key: rk, detail }))
    }
  }
  return out
}

// ---------------------------------------------------------------------------
//  Tableau joueurs (stats + XP) — LA fonction utilisée partout
// ---------------------------------------------------------------------------
export interface PlayerXP {
  player_id: string; team_id: string; position: Player['position']
  xp: number; matches: number; minutes: number; wins: number; draws: number; losses: number
  goals: number; assists: number; own_goals: number; yellow: number; red: number
  gk_matches: number; clean_sheets: number; saves: number; penalties_saved: number; shootout_saved: number; conceded: number
  /** tirs (matchs où les tirs ont été saisis par joueur) */
  shot: ShotTotals
  lines: XPLine[]
  byMatch: { match_id: string; xp: number }[]
}

export function computePlayerXP(data: XPData, scope: XPScope = {}): Map<string, PlayerXP> {
  const comps = new Map(data.competitions.map((c) => [c.id, c]))
  const cfg = xpConfig(data.xpRules, scope.seasonId)
  const matches = data.matches.filter((m) => isPlayed(m) && matchInScope(m, comps, scope))
  const out = new Map<string, PlayerXP>()
  const pmap = new Map(data.players.map((p) => [p.id, p]))
  const get = (pid: string) => {
    if (!out.has(pid)) {
      const p = pmap.get(pid); if (!p) return null
      out.set(pid, { player_id: pid, team_id: p.team_id, position: p.position, xp: 0, matches: 0, minutes: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, own_goals: 0, yellow: 0, red: 0, gk_matches: 0, clean_sheets: 0, saves: 0, penalties_saved: 0, shootout_saved: 0, conceded: 0, shot: emptyShots(), lines: [], byMatch: [] })
    }
    return out.get(pid)!
  }
  for (const p of data.players) if (!scope.seasonId || p.season_ids?.includes(scope.seasonId)) get(p.id)
  const cache = new Map<string, Map<string, number>>()
  const evByMatch = new Map<string, MatchEvent[]>()
  for (const e of data.events) { if (!evByMatch.has(e.match_id)) evByMatch.set(e.match_id, []); evByMatch.get(e.match_id)!.push(e) }
  for (const m of matches) {
    const evs = evByMatch.get(m.id) ?? []
    const sub: XPData = { ...data, events: evs }
    const lines = matchXPLines(sub, m, cfg, { rankCache: cache })
    // stats de comptage
    for (const teamId of [m.home_team_id, m.away_team_id]) {
      const lu = data.lineups.find((l) => l.match_id === m.id && l.team_id === teamId)
      let ps = participants(lu, evs, teamId)
      if (ps.size === 0) ps = new Set(evs.filter((e) => e.team_id === teamId).flatMap((e) => [e.player_id, e.type === 'goal' ? e.related_player_id : undefined]).filter(Boolean) as string[])
      const gf = teamId === m.home_team_id ? m.home_score! : m.away_score!, ga = teamId === m.home_team_id ? m.away_score! : m.home_score!
      const shotMap = playerMatchShots(evs, teamId)
      if (shotMap) for (const pid of new Set([...ps, ...shotMap.keys()])) {
        const s = get(pid); if (!s) continue
        const x = shotMap.get(pid)
        s.shot = addShots(s.shot, { shots: x?.shots ?? 0, on_target: x?.on_target ?? 0, goals: x?.goals ?? 0, matches: 1 })
      }
      for (const pid of ps) {
        const s = get(pid); if (!s) continue
        s.matches++
        if (gf > ga) s.wins++; else if (gf < ga) s.losses++; else s.draws++
      }
      for (const k of keeperMatchStats(m, lu, evs, teamId)) {
        const s = get(k.player_id); if (!s) continue
        s.gk_matches++; s.conceded += k.conceded; s.saves += k.saves; s.penalties_saved += k.penalties_saved; s.shootout_saved += k.shootout_saved
        if (k.clean_sheet) s.clean_sheets++
      }
    }
    for (const e of evs) {
      if (e.type === 'goal') { const s = e.player_id ? get(e.player_id) : null; if (s) s.goals++; const a = e.related_player_id && e.related_player_id !== e.player_id ? get(e.related_player_id) : null; if (a) a.assists++ }
      if (e.type === 'own_goal' && e.player_id) { const s = get(e.player_id); if (s) s.own_goals++ }
      if (e.type === 'yellow_card' && e.player_id) { const s = get(e.player_id); if (s) s.yellow++ }
      if ((e.type === 'red_card' || e.type === 'second_yellow') && e.player_id) { const s = get(e.player_id); if (s) { s.red++; if (e.type === 'second_yellow') s.yellow++ } }
    }
    const perPlayer = new Map<string, number>()
    for (const l of lines) {
      const s = get(l.player_id); if (!s) continue
      s.lines.push(l); s.xp += l.points
      perPlayer.set(l.player_id, (perPlayer.get(l.player_id) ?? 0) + l.points)
    }
    for (const [pid, xp] of perPlayer) get(pid)?.byMatch.push({ match_id: m.id, xp })
  }
  for (const l of seasonXPLines(data, scope.seasonId, cfg, comps, scope)) {
    const s = get(l.player_id); if (!s) continue
    s.lines.push(l); s.xp += l.points
  }
  if (scope.teamIds) { const keep = new Set(scope.teamIds); for (const [pid, x] of out) if (!keep.has(x.team_id)) out.delete(pid) }
  return out
}

// ---------------------------------------------------------------------------
//  Classements individuels & trophées
// ---------------------------------------------------------------------------
export interface Ranked<T> { item: T; rank: number; previousRank?: number | null; delta?: number | null }
type Cmp<T> = (a: T, b: T) => number

function rankList<T>(list: T[], cmp: Cmp<T>, tieKey: (x: T) => string): Ranked<T>[] {
  const sorted = [...list].sort(cmp)
  const out: Ranked<T>[] = []
  sorted.forEach((item, i) => {
    const prev = out[i - 1]
    out.push({ item, rank: prev && tieKey(prev.item) === tieKey(item) ? prev.rank : i + 1 })
  })
  return out
}

export type RaceKey = 'xp' | 'ballon_or' | 'golden_glove' | 'top_scorer' | 'top_assist'
export const RACE_LABEL: Record<RaceKey, string> = { xp: 'Classement XP', ballon_or: "Ballon d'or", golden_glove: "Gant d'or", top_scorer: "Soulier d'or", top_assist: 'Meilleur passeur' }

/** Critères de classement, dans l'ordre : source unique du tri ET du texte explicatif affiché sur le site. */
export interface RankCriterion { label: string; value: (s: PlayerXP) => number; dir: 'asc' | 'desc' }
const C = {
  xp: { label: 'XP', value: (s: PlayerXP) => s.xp, dir: 'desc' },
  goals: { label: 'buts', value: (s: PlayerXP) => s.goals, dir: 'desc' },
  assists: { label: 'passes décisives', value: (s: PlayerXP) => s.assists, dir: 'desc' },
  fewerMatches: { label: 'moins de matchs joués', value: (s: PlayerXP) => s.matches, dir: 'asc' },
  cleanSheets: { label: 'clean sheets', value: (s: PlayerXP) => s.clean_sheets, dir: 'desc' },
  fewerConceded: { label: 'moins de buts encaissés', value: (s: PlayerXP) => s.conceded, dir: 'asc' },
  saves: { label: 'arrêts', value: (s: PlayerXP) => s.saves, dir: 'desc' },
} satisfies Record<string, RankCriterion>
export const RACE_CRITERIA: Record<RaceKey, RankCriterion[]> = {
  xp: [C.xp, C.goals, C.assists, C.fewerMatches],
  ballon_or: [C.xp, C.goals, C.assists, C.fewerMatches],
  golden_glove: [C.xp, C.cleanSheets, C.fewerConceded, C.saves],
  top_scorer: [C.goals, C.assists, C.fewerMatches],
  top_assist: [C.assists, C.goals, C.fewerMatches],
}
/** Qui entre dans chaque classement (min = matchs minimum du barème). */
export const RACE_ELIGIBLE: Record<RaceKey, { label: string; test: (s: PlayerXP, min: number) => boolean }> = {
  xp: { label: 'tous les joueurs ayant joué au moins un match', test: (s) => s.matches > 0 || s.xp !== 0 },
  ballon_or: { label: 'joueurs de champ ayant joué le nombre minimum de matchs', test: (s, min) => s.position !== 'GK' && s.matches >= min },
  golden_glove: { label: 'gardiens ayant gardé les buts le nombre minimum de matchs', test: (s, min) => s.position === 'GK' && s.gk_matches >= min },
  top_scorer: { label: 'joueurs ayant marqué au moins un but', test: (s) => s.goals > 0 },
  top_assist: { label: 'joueurs ayant au moins une passe décisive', test: (s) => s.assists > 0 },
}

export function race(data: Pick<XPData, 'players' | 'xpRules'>, list: PlayerXP[], key: RaceKey, seasonId?: string | null): Ranked<PlayerXP>[] {
  const cfg = xpConfig(data.xpRules, seasonId)
  const name = new Map(data.players.map((p) => [p.id, `${p.last_name} ${p.first_name}`]))
  const crit = RACE_CRITERIA[key]
  const cmp = (a: PlayerXP, b: PlayerXP) => {
    for (const c of crit) { const d = c.dir === 'desc' ? c.value(b) - c.value(a) : c.value(a) - c.value(b); if (d) return d }
    return (name.get(a.player_id) ?? '').localeCompare(name.get(b.player_id) ?? '') // départage final : ordre alphabétique (même rang)
  }
  const min = cfg.min_matches_awards
  return rankList(list.filter((s) => RACE_ELIGIBLE[key].test(s, min)), cmp, (s) => crit.map((c) => c.value(s)).join('|'))
}

/** Dernière journée jouée du périmètre */
export function lastRoundKey(data: Pick<XPData, 'matches' | 'competitions'>, scope: XPScope): string | null {
  const comps = new Map(data.competitions.map((c) => [c.id, c]))
  const keys = data.matches.filter((m) => isPlayed(m) && matchInScope(m, comps, scope)).map(roundKey).sort()
  return keys.at(-1) ?? null
}

/** Course avec évolution ▲▼ depuis la journée précédente. */
export function raceWithEvolution(data: XPData, scope: XPScope, key: RaceKey): Ranked<PlayerXP>[] {
  const cur = race(data, [...computePlayerXP(data, scope).values()], key, scope.seasonId)
  const lrk = lastRoundKey(data, scope)
  if (!lrk) return cur.map((r) => ({ ...r, previousRank: null, delta: null }))
  const prev = race(data, [...computePlayerXP(data, { ...scope, excludeFromRoundKey: lrk }).values()], key, scope.seasonId)
  const pr = new Map(prev.map((r) => [r.item.player_id, r.rank]))
  return cur.map((r) => { const p = pr.get(r.item.player_id) ?? null; return { ...r, previousRank: p, delta: p == null ? null : p - r.rank } })
}

/**
 * Recrue = joueur RÉELLEMENT nouveau dans la MBL : coché « Recrue » dans l'admin, ou (case non renseignée) sans aucun
 * historique approuvé (pas de lien vers une fiche d'une saison précédente) ET dans une équipe nouvelle (1re saison MBL).
 * Sans information sur l'équipe : pas de mention (par défaut, on ne l'affiche pas).
 */
export const isRookie = (p: Pick<Player, 'season_ids' | 'rookie' | 'link'>, teamSeasons?: number) =>
  p.rookie === true || (p.rookie !== false && !p.link && (p.season_ids?.length ?? 0) <= 1 && teamSeasons === 1)
