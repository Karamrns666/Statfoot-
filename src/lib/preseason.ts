// ============================================================================
//  PRÉ-SAISON — système suisse (fonctions PURES, testées ; reproduit le fichier « Pré-saison – Système suisse »)
//   • J1 : tirage au sort intégral (graine enregistrée → rejouable) ; les 2 premières tirées jouent ensemble, etc.
//     Nombre impair d'équipes : la dernière tirée est au repos.
//   • J2…Jn : classement de pré-saison → équipe au repos = la moins bien classée pas encore au repos ;
//     même total de points ensemble (1re-2e, 3e-4e…), sinon adversaire libre au total le plus proche ;
//     JAMAIS de rematch : recherche avec retour arrière (backtracking), jamais bloquée.
//   • Rattrapage : les équipes au repos (une par journée) jouent entre elles (1re-2e, 3e-4e…, sans rematch).
//   • Départage pré-saison : points, différence, buts marqués, force des adversaires, tirage au sort.
//     Pendant les journées, la force n'est pas encore significative (1 à 3 adversaires) : elle ne départage
//     que le classement final (après le rattrapage) — exactement comme le fichier de référence.
//   Le départage des championnats (MASTER / CHALLENGER) est celui du règlement (Art. 17.3 : `rankTable`).
// ============================================================================
import { seededRng } from './draw'

export type PreseasonCriterion = 'points' | 'diff' | 'gf' | 'force' | 'draw'
export interface PreseasonConfig {
  rounds: number
  points: { win: number; draw: number; loss: number }
  /** taille de la division MASTER (les suivants → CHALLENGER) */
  masterSize: number
  /** ordre de départage pendant les journées et pour le classement final */
  intermediateOrder: PreseasonCriterion[]
  finalOrder: PreseasonCriterion[]
}
export const PRESEASON_DEFAULTS: PreseasonConfig = {
  rounds: 4,
  points: { win: 3, draw: 1, loss: 0 },
  masterSize: 11,
  intermediateOrder: ['points', 'diff', 'gf', 'draw'],
  finalOrder: ['points', 'diff', 'gf', 'force', 'draw'],
}
export const CRITERION_LABEL: Record<PreseasonCriterion, string> = { points: 'Points', diff: 'Différence de buts', gf: 'Buts marqués', force: 'Force des adversaires', draw: 'Tirage au sort' }
export function resolvePreseasonConfig(o?: Partial<PreseasonConfig> | null): PreseasonConfig {
  return { ...PRESEASON_DEFAULTS, ...(o ?? {}), points: { ...PRESEASON_DEFAULTS.points, ...(o?.points ?? {}) } }
}

/** Match de pré-saison (vue simplifiée d'un Match). round = rounds + 1 pour le rattrapage. */
export interface PMatch { id?: string; round: number; home: string; away: string; hs?: number | null; as?: number | null; played: boolean; reason?: string }

// ---------------------------------------------------------------------------
//  Format : nombre de matchs, repos, rattrapage
// ---------------------------------------------------------------------------
export interface PreseasonFormat { teams: number; rounds: number; perRound: number; resting: boolean; catchup: number; total: number; matchesPerTeam: number; equal: boolean; warnings: string[] }
export function preseasonFormat(teams: number, rounds: number): PreseasonFormat {
  const resting = teams % 2 === 1
  const perRound = Math.floor(teams / 2)
  const catchup = resting ? Math.floor(rounds / 2) : 0
  const warnings: string[] = []
  if (teams < 4) warnings.push('Il faut au moins 4 équipes.')
  if (rounds >= teams) warnings.push(`Avec ${teams} équipes, ${rounds} journées sans rematch sont impossibles (maximum ${teams - 1}).`)
  if (resting && rounds > teams) warnings.push('Plus de journées que d’équipes : une équipe serait au repos deux fois.')
  const equal = !resting || rounds % 2 === 0
  if (!equal) warnings.push(`Nombre impair de journées (${rounds}) avec un nombre impair d’équipes : ${rounds} équipes au repos ne peuvent pas toutes rattraper leur match (une équipe jouera un match de moins).`)
  return { teams, rounds, perRound, resting, catchup, total: rounds * perRound + catchup, matchesPerTeam: rounds, equal, warnings }
}

// ---------------------------------------------------------------------------
//  Tirage de la journée 1 (graine enregistrée → rejouable à l'identique)
// ---------------------------------------------------------------------------
export function drawRound1(teamIds: string[], seed: number) {
  const rng = seededRng(seed)
  const order = [...teamIds].sort()
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]] }
  return round1FromOrder(order)
}
export function round1FromOrder(order: string[]) {
  const pairs: PMatch[] = []
  for (let i = 0; i + 1 < order.length; i += 2) pairs.push({ round: 1, home: order[i], away: order[i + 1], played: false, reason: 'Tirage au sort' })
  return { order, pairs, rest: order.length % 2 ? order[order.length - 1] : undefined }
}

// ---------------------------------------------------------------------------
//  Classement de pré-saison
// ---------------------------------------------------------------------------
export interface PreseasonRow {
  team_id: string; rank: number; played: number; won: number; drawn: number; lost: number
  gf: number; ga: number; diff: number; points: number; force: number; opponents: string[]
}
/**
 * Départage SPÉCIFIQUE à la pré-saison (pas de confrontation directe, pas de cartons).
 * `drawOrder` : ordre du tirage au sort Ardentia (critère 5) — par défaut l'ordre du tirage de la J1.
 */
export function preseasonRanking(teamIds: string[], matches: PMatch[], opts: { order?: PreseasonCriterion[]; drawOrder?: string[]; points?: PreseasonConfig['points'] } = {}): PreseasonRow[] {
  const pts = opts.points ?? PRESEASON_DEFAULTS.points
  const order = opts.order ?? PRESEASON_DEFAULTS.finalOrder
  const rows = new Map<string, PreseasonRow>(teamIds.map((id) => [id, { team_id: id, rank: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, diff: 0, points: 0, force: 0, opponents: [] }]))
  for (const m of matches) {
    if (!m.played || m.hs == null || m.as == null) continue
    for (const [t, o, f, a] of [[m.home, m.away, m.hs, m.as], [m.away, m.home, m.as, m.hs]] as const) {
      const r = rows.get(t); if (!r) continue
      r.played++; r.gf += f; r.ga += a; r.opponents.push(o)
      if (f > a) { r.won++; r.points += pts.win } else if (f === a) { r.drawn++; r.points += pts.draw } else { r.lost++; r.points += pts.loss }
    }
  }
  for (const r of rows.values()) { r.diff = r.gf - r.ga; r.force = r.opponents.reduce((s, o) => s + (rows.get(o)?.points ?? 0), 0) }
  const drawRank = new Map((opts.drawOrder ?? []).map((id, i) => [id, i]))
  const value = (r: PreseasonRow, c: PreseasonCriterion) => (c === 'points' ? -r.points : c === 'diff' ? -r.diff : c === 'gf' ? -r.gf : c === 'force' ? -r.force : drawRank.get(r.team_id) ?? 1e6)
  const list = [...rows.values()].sort((a, b) => {
    for (const c of order) { const d = value(a, c) - value(b, c); if (d) return d }
    return a.team_id.localeCompare(b.team_id)
  })
  list.forEach((r, i) => { r.rank = i + 1 })
  return list
}

// ---------------------------------------------------------------------------
//  Appariement d'une journée (backtracking, jamais de rematch)
// ---------------------------------------------------------------------------
export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)
export const reasonSame = (p: number) => `Même total de points (${p} pts)`
export const reasonClose = (a: number, b: number) => `Points proches (${a} pts contre ${b} pts) ; pas de meilleur adversaire libre`

export interface RoundPlan { round: number; rest?: string; pairs: PMatch[] }

/**
 * Journée suivante à partir du classement en cours (ordre `ranked`), des équipes déjà au repos et des matchs joués.
 * L'équipe au repos est la moins bien classée pas encore au repos ; si cela rend l'appariement impossible,
 * la suivante est essayée. Chaque équipe affronte d'abord un adversaire au même total, sinon au total le plus
 * proche (à égalité d'écart : le mieux classé) ; retour arrière si une impasse apparaît plus bas.
 */
export function pairRound(round: number, ranked: PreseasonRow[], rested: string[], played: PMatch[]): RoundPlan {
  const done = new Set(played.map((m) => pairKey(m.home, m.away)))
  const ids = ranked.map((r) => r.team_id)
  const pts = new Map(ranked.map((r) => [r.team_id, r.points]))
  const restCandidates = ids.length % 2 ? [...ids].reverse().filter((t) => !rested.includes(t)).concat([...ids].reverse().filter((t) => rested.includes(t))) : [undefined]
  for (const rest of restCandidates) {
    const pool = ids.filter((t) => t !== rest)
    const pairs = backtrack(pool, (a, b) => !done.has(pairKey(a, b)), (a, b) => Math.abs(pts.get(a)! - pts.get(b)!))
    if (pairs) return { round, rest, pairs: pairs.map(([a, b]) => ({ round, home: a, away: b, played: false, reason: pts.get(a) === pts.get(b) ? reasonSame(pts.get(a)!) : reasonClose(pts.get(a)!, pts.get(b)!) })) }
  }
  throw new Error(`Journée ${round} : aucun appariement possible sans rematch.`)
}

/** Recherche avec retour arrière : la 1re équipe libre (la mieux classée) prend le meilleur adversaire autorisé. */
function backtrack(pool: string[], allowed: (a: string, b: string) => boolean, cost: (a: string, b: string) => number): [string, string][] | null {
  const out: [string, string][] = []
  const rank = new Map(pool.map((t, i) => [t, i]))
  let steps = 0
  const go = (rem: string[]): boolean => {
    if (!rem.length) return true
    if (++steps > 2_000_000) return false
    const [a, ...rest] = rem
    const cands = rest.filter((b) => allowed(a, b)).sort((x, y) => cost(a, x) - cost(a, y) || rank.get(x)! - rank.get(y)!)
    for (const b of cands) {
      out.push([a, b])
      if (go(rest.filter((t) => t !== b))) return true
      out.pop()
    }
    return false
  }
  return go(pool) ? out : null
}

/** Rattrapage : les équipes au repos, classées entre elles, jouent 1re-2e, 3e-4e… sans rematch. */
export function pairCatchup(round: number, ranked: PreseasonRow[], rested: string[], played: PMatch[]): RoundPlan {
  const done = new Set(played.map((m) => pairKey(m.home, m.away)))
  const pool = ranked.filter((r) => rested.includes(r.team_id))
  const pts = new Map(pool.map((r) => [r.team_id, r.points]))
  const ids = pool.map((r) => r.team_id)
  const even = ids.length % 2 ? ids.slice(0, -1) : ids
  const pairs = backtrack(even, (a, b) => !done.has(pairKey(a, b)), () => 0)
  if (!pairs) throw new Error('Rattrapage : aucun appariement possible sans rematch.')
  return { round, rest: ids.length % 2 ? ids[ids.length - 1] : undefined, pairs: pairs.map(([a, b]) => ({ round, home: a, away: b, played: false, reason: `Toutes deux au repos une fois (${pts.get(a)} pts / ${pts.get(b)} pts)` })) }
}

// ---------------------------------------------------------------------------
//  État complet de la pré-saison
// ---------------------------------------------------------------------------
export interface PreseasonState {
  format: PreseasonFormat
  /** équipe au repos par journée (1 … rounds) */
  rests: Record<number, string | undefined>
  /** journées dont tous les matchs sont joués */
  completedRounds: number[]
  /** prochaine journée à générer (rounds + 1 = rattrapage), null si tout est généré */
  nextRound: number | null
  finished: boolean
  ranking: PreseasonRow[]
}
export function preseasonState(teamIds: string[], matches: PMatch[], rests: Record<number, string | undefined>, cfg: PreseasonConfig, drawOrder: string[]): PreseasonState {
  const format = preseasonFormat(teamIds.length, cfg.rounds)
  const total = cfg.rounds + (format.catchup ? 1 : 0)
  const byRound = (r: number) => matches.filter((m) => m.round === r)
  const completedRounds: number[] = []
  for (let r = 1; r <= total; r++) { const ms = byRound(r); if (ms.length && ms.every((m) => m.played)) completedRounds.push(r) }
  let nextRound: number | null = null
  for (let r = 1; r <= total; r++) if (!byRound(r).length) { nextRound = r; break }
  const finished = nextRound === null && completedRounds.length === total
  const ranking = preseasonRanking(teamIds, matches, { order: finished ? cfg.finalOrder : cfg.intermediateOrder, drawOrder, points: cfg.points })
  return { format, rests, completedRounds, nextRound, finished, ranking }
}

/** Génère la journée suivante (J1 exclue : tirage). Exige que toutes les journées précédentes soient jouées. */
export function generateNextRound(teamIds: string[], matches: PMatch[], rests: Record<number, string | undefined>, cfg: PreseasonConfig, drawOrder: string[]): RoundPlan {
  const st = preseasonState(teamIds, matches, rests, cfg, drawOrder)
  if (st.nextRound == null) throw new Error('Toutes les journées sont déjà générées.')
  if (st.nextRound === 1) throw new Error('La journée 1 se fait par tirage au sort.')
  for (let r = 1; r < st.nextRound; r++) if (!st.completedRounds.includes(r)) throw new Error(`Tous les résultats de la journée ${r} doivent être validés avant de générer la suivante.`)
  const ranked = preseasonRanking(teamIds, matches, { order: cfg.intermediateOrder, drawOrder, points: cfg.points })
  const rested = Object.values(rests).filter(Boolean) as string[]
  return st.nextRound > cfg.rounds ? pairCatchup(st.nextRound, ranked, rested, matches) : pairRound(st.nextRound, ranked, rested, matches)
}

/** Vérifie un appariement modifié à la main : chaque équipe une fois, pas de rematch. */
export function validateRound(plan: RoundPlan, played: PMatch[], expectedTeams: string[]): string[] {
  const errs: string[] = []
  const done = new Set(played.filter((m) => m.round !== plan.round).map((m) => pairKey(m.home, m.away)))
  const seen = new Map<string, number>()
  for (const m of plan.pairs) {
    if (m.home === m.away) errs.push('Une équipe ne peut pas jouer contre elle-même.')
    if (done.has(pairKey(m.home, m.away))) errs.push(`Rematch interdit : ces deux équipes se sont déjà rencontrées.`)
    for (const t of [m.home, m.away]) seen.set(t, (seen.get(t) ?? 0) + 1)
  }
  for (const [t, n] of seen) if (n > 1) errs.push(`Une équipe est programmée ${n} fois (${t}).`)
  const missing = expectedTeams.filter((t) => !seen.has(t) && t !== plan.rest)
  if (missing.length) errs.push(`${missing.length} équipe(s) sans match.`)
  return [...new Set(errs)]
}

/** Répartition MASTER / CHALLENGER à partir du classement final. */
export function divisionSplit(ranking: PreseasonRow[], masterSize: number) {
  return { master: ranking.slice(0, masterSize).map((r) => r.team_id), challenger: ranking.slice(masterSize).map((r) => r.team_id) }
}

/** Parcours d'une équipe : ses matchs dans l'ordre, sa journée de repos. */
export function teamPath(teamId: string, matches: PMatch[], rests: Record<number, string | undefined>, rounds: number, name: (id: string) => string) {
  const ms = matches.filter((m) => m.home === teamId || m.away === teamId).sort((a, b) => a.round - b.round)
  const lines = ms.map((m) => {
    const home = m.home === teamId, opp = home ? m.away : m.home
    const label = m.round > rounds ? 'Rattrapage' : `J${m.round}`
    if (!m.played || m.hs == null || m.as == null) return { round: m.round, label, text: `${label} · contre ${name(opp)}`, result: null as null | 'W' | 'D' | 'L', opp }
    const f = home ? m.hs : m.as, a = home ? m.as : m.hs
    const result = f > a ? 'W' : f === a ? 'D' : 'L'
    return { round: m.round, label, opp, result, text: `${label} · ${result === 'W' ? 'Victoire' : result === 'D' ? 'Nul' : 'Défaite'} ${f} - ${a} contre ${name(opp)}` }
  })
  const rest = Object.entries(rests).find(([, t]) => t === teamId)?.[0]
  return { lines, rest: rest ? Number(rest) : undefined }
}
