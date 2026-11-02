// Génération de calendrier, planification et tableau final — fonctions pures.
import type { BracketSource, Match, MatchStage } from '@/types/entities'
import { isPlayed, loserOf, winnerOf, type StandingRow } from './stats'

export interface Pairing { round: number; home: string; away: string }

/**
 * Round-robin par la méthode du cercle (Berger). Avec un nombre impair d'équipes, une équipe est exempte à chaque journée.
 * Aller/retour : la phase retour inverse domicile/extérieur.
 */
export function roundRobin(teamIds: string[], double = true): Pairing[] {
  const teams: (string | null)[] = [...teamIds]
  if (teams.length < 2) return []
  if (teams.length % 2 === 1) teams.push(null)
  const n = teams.length
  const rounds = n - 1
  const out: Pairing[] = []
  let arr = [...teams]
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i]
      if (a === null || b === null) continue
      // alternance domicile/extérieur pour équilibrer
      const swap = i === 0 ? r % 2 === 1 : (i + r) % 2 === 1
      out.push({ round: r + 1, home: swap ? b : a, away: swap ? a : b })
    }
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)]
  }
  if (double) {
    const first = [...out]
    for (const p of first) out.push({ round: p.round + rounds, home: p.away, away: p.home })
  }
  return out
}

export interface SlotConfig {
  /** dates des journées (YYYY-MM-DD), une par journée ; si manquante : startDate + 7j × (journée-1) */
  startDate: string
  intervalDays?: number
  times: string[] // ex. ['18:30', '19:30', '20:30']
  pitches: { venue_id?: string; pitch: string }[]
}

/**
 * Planifie des créneaux : chaque journée occupe une date ; les matchs sont répartis sur (heure × terrain)
 * sans qu'une équipe ne joue deux fois sur le même créneau horaire.
 */
export function planSlots(pairings: Pairing[], cfg: SlotConfig) {
  const interval = cfg.intervalDays ?? 7
  const out: (Pairing & { date: string; venue_id?: string; pitch: string })[] = []
  const byRound = new Map<number, Pairing[]>()
  for (const p of pairings) { if (!byRound.has(p.round)) byRound.set(p.round, []); byRound.get(p.round)!.push(p) }
  for (const [round, ps] of [...byRound.entries()].sort((a, b) => a[0] - b[0])) {
    const day = addDays(cfg.startDate, (round - 1) * interval)
    const busy = new Map<string, Set<string>>() // time -> teams
    const used = new Map<string, number>() // time -> pitches used
    for (const p of ps) {
      let placed = false
      for (const t of cfg.times) {
        const teams = busy.get(t) ?? new Set()
        const n = used.get(t) ?? 0
        if (n >= cfg.pitches.length || teams.has(p.home) || teams.has(p.away)) continue
        teams.add(p.home); teams.add(p.away); busy.set(t, teams); used.set(t, n + 1)
        out.push({ ...p, date: `${day}T${t}:00`, venue_id: cfg.pitches[n].venue_id, pitch: cfg.pitches[n].pitch })
        placed = true
        break
      }
      if (!placed) out.push({ ...p, date: `${day}T${cfg.times.at(-1) ?? '20:00'}:00`, pitch: 'À définir' })
    }
  }
  return out
}

export function addDays(date: string, days: number) {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
//  Tableau final
// ---------------------------------------------------------------------------
export const STAGE_LABELS: Record<MatchStage, string> = {
  league: 'Championnat', group: 'Phase de groupes', round_of_16: 'Huitièmes', quarter: 'Quarts de finale',
  semi: 'Demi-finales', third_place: 'Petite finale', final: 'Finale',
}
export const STAGE_SHORT: Record<MatchStage, string> = { league: 'L', group: 'G', round_of_16: 'R16', quarter: 'QF', semi: 'SF', third_place: '3P', final: 'F' }

export interface BracketMatchDraft {
  stage: MatchStage; bracket_slot: string; home_source: BracketSource; away_source: BracketSource
}

/**
 * Construit la structure d'un tableau à partir du nombre de qualifiés.
 * - groupes : croisement 1er A – 2e B, 1er B – 2e A… (ref = id de groupe)
 * - ligue unique : 1er – dernier qualifié, 2e – avant-dernier…
 */
export function buildBracket(opts: { groupIds?: string[]; leagueRef?: string; qualifiers: number; thirdPlace?: boolean }): BracketMatchDraft[] {
  const { qualifiers } = opts
  const firstStage: MatchStage = qualifiers >= 16 ? 'round_of_16' : qualifiers >= 8 ? 'quarter' : qualifiers >= 4 ? 'semi' : 'final'
  const entrants: BracketSource[] = []
  if (opts.groupIds && opts.groupIds.length > 1) {
    const g = opts.groupIds
    const perGroup = Math.max(1, Math.floor(qualifiers / g.length))
    // ordre en serpentin pour croiser les groupes
    const gr = (ref: string, rank: number): BracketSource => ({ type: 'group_rank', ref, rank })
    for (let i = 0; i < g.length; i += 2) {
      const a = g[i], b = g[i + 1] ?? g[0]
      if (perGroup === 1) { entrants.push(gr(a, 1), gr(b, 1)); continue }
      // croisement : 1er A – 2e B, 1er B – 2e A (puis 3e A – 4e B…)
      for (let r = 1; r + 1 <= perGroup; r += 2) entrants.push(gr(a, r), gr(b, r + 1), gr(b, r), gr(a, r + 1))
    }
  } else {
    const ref = opts.leagueRef ?? opts.groupIds?.[0] ?? 'league'
    const ranks = Array.from({ length: qualifiers }, (_, i) => i + 1)
    for (let i = 0; i < qualifiers / 2; i++) entrants.push({ type: 'league_rank', ref, rank: ranks[i] }, { type: 'league_rank', ref, rank: ranks[qualifiers - 1 - i] })
  }
  const out: BracketMatchDraft[] = []
  const stageOrder: MatchStage[] = ['round_of_16', 'quarter', 'semi', 'final']
  let stage: MatchStage = firstStage
  let prev: string[] = []
  const nFirst = entrants.length / 2
  for (let i = 0; i < nFirst; i++) {
    const slot = `${STAGE_SHORT[stage]}${i + 1}`
    out.push({ stage, bracket_slot: slot, home_source: entrants[2 * i], away_source: entrants[2 * i + 1] })
    prev.push(slot)
  }
  while (stage !== 'final') {
    const next: MatchStage = stageOrder[stageOrder.indexOf(stage) + 1]
    const cur: string[] = []
    if (next === 'final' && opts.thirdPlace && prev.length === 2) {
      out.push({ stage: 'third_place', bracket_slot: '3P', home_source: { type: 'loser', ref: prev[0] }, away_source: { type: 'loser', ref: prev[1] } })
    }
    for (let i = 0; i < prev.length / 2; i++) {
      const slot = next === 'final' ? 'F' : `${STAGE_SHORT[next]}${i + 1}`
      out.push({ stage: next, bracket_slot: slot, home_source: { type: 'winner', ref: prev[2 * i] }, away_source: { type: 'winner', ref: prev[2 * i + 1] } })
      cur.push(slot)
    }
    prev = cur
    stage = next
  }
  return out
}

/** Résout une source du tableau en id d'équipe (ou null si pas encore déterminable). */
export function resolveSource(src: BracketSource | undefined, ctx: { tables: Map<string, StandingRow[]>; tablesComplete: Map<string, boolean>; matches: Match[]; competitionId: string }): string | null {
  if (!src) return null
  if (src.type === 'group_rank' || src.type === 'league_rank') {
    if (!ctx.tablesComplete.get(src.ref)) return null
    return ctx.tables.get(src.ref)?.[(src.rank ?? 1) - 1]?.team_id ?? null
  }
  const m = ctx.matches.find((x) => x.competition_id === ctx.competitionId && x.bracket_slot === src.ref)
  if (!m || !isPlayed(m)) return null
  return src.type === 'winner' ? winnerOf(m) : loserOf(m)
}

export function sourceLabel(src: BracketSource | undefined, groupName: (id: string) => string): string {
  if (!src) return 'À déterminer'
  if (src.type === 'group_rank') return `${src.rank}${src.rank === 1 ? 'er' : 'e'} ${groupName(src.ref)}`
  if (src.type === 'league_rank') return `${src.rank}${src.rank === 1 ? 'er' : 'e'} du classement`
  return `${src.type === 'winner' ? 'Vainqueur' : 'Perdant'} ${src.ref}`
}
