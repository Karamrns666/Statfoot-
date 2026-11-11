// ============================================================================
//  Match des capitaines — fonctions PURES.
//  Mini-tournoi mensuel ORANGE vs BLEUE, totalement séparé de la ligue : ses données vivent dans
//  CaptainTeam / CaptainMatch et ne sont lues QUE par ce module. Aucun calcul de la ligue
//  (classements, XP, IPG, stats joueurs, cartons et suspensions, bandeau de saison) ne les voit
//  (test : captains.isolation.test.ts).
// ============================================================================
import type { CaptainLine, CaptainMatch, CaptainSide, CaptainTeam } from '@/types/entities'

export const CAPTAIN_SIDES: CaptainSide[] = ['orange', 'bleue']
export const CAPTAIN_COLORS: Record<CaptainSide, string> = { orange: '#F05A22', bleue: '#1F6FE0' }
export const other = (s: CaptainSide): CaptainSide => (s === 'orange' ? 'bleue' : 'orange')

export function defaultCaptainTeams(): CaptainTeam[] {
  return [
    { id: 'cap_orange', side: 'orange', name: 'Équipe Orange', color: CAPTAIN_COLORS.orange, player_ids: [] },
    { id: 'cap_bleue', side: 'bleue', name: 'Équipe Bleue', color: CAPTAIN_COLORS.bleue, player_ids: [] },
  ]
}

/** Les deux équipes (valeurs par défaut si l'admin n'a encore rien enregistré). */
export function captainTeams(rows: CaptainTeam[] = []): Record<CaptainSide, CaptainTeam> {
  const d = defaultCaptainTeams()
  return { orange: rows.find((t) => t.side === 'orange') ?? d[0], bleue: rows.find((t) => t.side === 'bleue') ?? d[1] }
}

/** Logo par défaut : écusson rond à la couleur de l'équipe avec l'initiale. */
export function captainLogo(t: Pick<CaptainTeam, 'logo_url' | 'side' | 'color' | 'name'>) {
  if (t.logo_url) return t.logo_url
  const c = t.color ?? CAPTAIN_COLORS[t.side]
  const letter = (t.side === 'orange' ? 'O' : 'B')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#0B2E73"/></linearGradient></defs><path d="M50 4 90 18v30c0 24-17 40-40 48C27 88 10 72 10 48V18z" fill="url(#g)" stroke="#fff" stroke-width="4"/><text x="50" y="66" font-family="Arial Black,Arial,sans-serif" font-size="44" font-weight="900" fill="#fff" text-anchor="middle">${letter}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const isFinished = (m: Pick<CaptainMatch, 'status'>) => m.status === 'finished'

/** Score = buts de l'équipe + buts contre son camp de l'adversaire. */
export function captainScore(m: Pick<CaptainMatch, 'lines'>): Record<CaptainSide, number> {
  const g = (s: CaptainSide) => m.lines.filter((l) => l.side === s).reduce((a, l) => a + l.goals, 0) + m.lines.filter((l) => l.side === other(s)).reduce((a, l) => a + l.og, 0)
  return { orange: g('orange'), bleue: g('bleue') }
}

/** V / N / D du point de vue d'une équipe (le match nul reste nul ; les tirs au but désignent le vainqueur du jour). */
export function captainResult(m: CaptainMatch, side: CaptainSide): 'W' | 'D' | 'L' | null {
  if (!isFinished(m)) return null
  const s = captainScore(m)
  return s[side] > s[other(side)] ? 'W' : s[side] < s[other(side)] ? 'L' : 'D'
}
export function shootoutWinner(m: CaptainMatch): CaptainSide | null {
  const s = captainScore(m)
  if (s.orange !== s.bleue || m.orange_pens == null || m.bleue_pens == null || m.orange_pens === m.bleue_pens) return null
  return m.orange_pens > m.bleue_pens ? 'orange' : 'bleue'
}

export interface CaptainRecord { played: number; won: number; drawn: number; lost: number; gf: number; ga: number }
export function captainRecord(matches: CaptainMatch[]): Record<CaptainSide, CaptainRecord> {
  const r = (): CaptainRecord => ({ played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 })
  const out = { orange: r(), bleue: r() }
  for (const m of matches.filter(isFinished)) {
    const s = captainScore(m)
    for (const side of CAPTAIN_SIDES) {
      const x = out[side]; x.played++; x.gf += s[side]; x.ga += s[other(side)]
      const res = captainResult(m, side); if (res === 'W') x.won++; else if (res === 'D') x.drawn++; else x.lost++
    }
  }
  return out
}

export const monthKey = (date: string) => date.slice(0, 7)
/** Matchs groupés par mois, du plus récent au plus ancien. */
export function captainMonths(matches: CaptainMatch[]) {
  const by = new Map<string, CaptainMatch[]>()
  for (const m of [...matches].filter((x) => x.status !== 'cancelled').sort((a, b) => b.date.localeCompare(a.date))) {
    const k = monthKey(m.date); if (!by.has(k)) by.set(k, []); by.get(k)!.push(m)
  }
  return [...by.entries()].map(([month, ms]) => ({ month, matches: ms }))
}

export function nextCaptainMatch(matches: CaptainMatch[], now = new Date()) {
  const iso = now.toISOString()
  return [...matches].filter((m) => m.status === 'scheduled' && m.date >= iso).sort((a, b) => a.date.localeCompare(b.date))[0]
}
export function lastCaptainMatch(matches: CaptainMatch[]) {
  return [...matches].filter(isFinished).sort((a, b) => b.date.localeCompare(a.date))[0]
}

export interface CaptainPlayerStats {
  player_id: string; side: CaptainSide; played: number; goals: number; assists: number; og: number; yc: number; rc: number
  motm: number; gk_matches: number; saves: number; conceded: number; clean_sheets: number
}
/** Statistiques individuelles du Match des capitaines uniquement. */
export function captainPlayerStats(matches: CaptainMatch[]): CaptainPlayerStats[] {
  const map = new Map<string, CaptainPlayerStats>()
  for (const m of matches.filter(isFinished)) {
    const score = captainScore(m)
    for (const l of m.lines.filter((x) => x.played || x.goals || x.assists || x.yc || x.rc || x.og)) {
      const s = map.get(l.player_id) ?? { player_id: l.player_id, side: l.side, played: 0, goals: 0, assists: 0, og: 0, yc: 0, rc: 0, motm: 0, gk_matches: 0, saves: 0, conceded: 0, clean_sheets: 0 }
      s.side = l.side; s.played++; s.goals += l.goals; s.assists += l.assists; s.og += l.og; s.yc += l.yc; s.rc += l.rc
      if (l.gk) { s.gk_matches++; s.saves += l.saves; const c = score[other(l.side)]; s.conceded += c; if (c === 0) s.clean_sheets++ }
      map.set(l.player_id, s)
    }
    if (m.motm_player_id) { const s = map.get(m.motm_player_id); if (s) s.motm++ }
  }
  return [...map.values()]
}
export const topScorers = (st: CaptainPlayerStats[]) => st.filter((s) => s.goals > 0).sort((a, b) => b.goals - a.goals || a.played - b.played)
export const topAssisters = (st: CaptainPlayerStats[]) => st.filter((s) => s.assists > 0).sort((a, b) => b.assists - a.assists || a.played - b.played)
export const topKeepers = (st: CaptainPlayerStats[]) => st.filter((s) => s.gk_matches > 0).sort((a, b) => b.clean_sheets - a.clean_sheets || b.saves - a.saves || a.conceded - b.conceded)

/** Ligne vide d'un joueur de l'effectif (formulaire de saisie). */
export const emptyLine = (side: CaptainSide, player_id: string): CaptainLine => ({ side, player_id, played: false, goals: 0, og: 0, assists: 0, yc: 0, rc: 0, saves: 0 })
/** Contrôles de cohérence de la feuille (affichés avant d'enregistrer). */
export function sheetWarnings(m: Pick<CaptainMatch, 'lines' | 'orange_pens' | 'bleue_pens' | 'status'>, maxOnPitch = 6) {
  const w: string[] = []
  for (const side of CAPTAIN_SIDES) {
    const mine = m.lines.filter((l) => l.side === side)
    const goals = mine.reduce((a, l) => a + l.goals, 0) + m.lines.filter((l) => l.side === other(side)).reduce((a, l) => a + l.og, 0)
    const assists = mine.reduce((a, l) => a + l.assists, 0)
    const label = side === 'orange' ? 'Orange' : 'Bleue'
    if (assists > goals) w.push(`${label} : plus de passes décisives (${assists}) que de buts (${goals}).`)
    if (mine.filter((l) => l.gk).length > 1) w.push(`${label} : un seul gardien par équipe.`)
    if (m.status === 'finished' && mine.filter((l) => l.played).length < maxOnPitch && mine.length >= maxOnPitch) w.push(`${label} : moins de ${maxOnPitch} joueurs cochés « A joué ».`)
  }
  const s = captainScore(m)
  if ((m.orange_pens != null || m.bleue_pens != null) && s.orange !== s.bleue) w.push('Tirs au but saisis alors que le score n’est pas nul.')
  return w
}
