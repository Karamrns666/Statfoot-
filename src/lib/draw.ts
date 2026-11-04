// Tirage au sort par pots — fonctions pures (le hasard est injecté pour être testable).
import type { Draw, DrawPick } from '@/types/entities'

export type Rng = () => number

/** Prochaine équipe à tirer : on vide les pots dans l'ordre (pot 1 = têtes de série). */
export function nextPot(draw: Draw): number | null {
  const picked = new Set((draw.picks ?? []).map((p) => p.team_id))
  for (const pot of [...(draw.pots ?? [])].sort((a, b) => a.pot - b.pot)) {
    if (pot.team_ids.some((t) => !picked.has(t))) return pot.pot
  }
  return null
}

/**
 * Effectue un tirage : une équipe au hasard du pot courant, placée dans le prochain groupe
 * (ordre A, B, C…) qui n'a pas encore d'équipe de ce pot (contrainte « 1 équipe par pot et par groupe »).
 */
export function drawOne(draw: Draw, groupIds: string[], rng: Rng = Math.random, now = new Date().toISOString()): DrawPick | null {
  const potNo = nextPot(draw)
  if (potNo === null || groupIds.length === 0) return null
  const picks = draw.picks ?? []
  const picked = new Set(picks.map((p) => p.team_id))
  const pot = draw.pots!.find((p) => p.pot === potNo)!
  const remaining = pot.team_ids.filter((t) => !picked.has(t))
  const team = remaining[Math.floor(rng() * remaining.length) % remaining.length]
  const countIn = (g: string) => picks.filter((p) => p.group_id === g && (draw.one_team_per_pot_per_group === false || p.pot === potNo)).length
  // groupe le moins rempli (pour ce pot si contrainte active), puis ordre alphabétique
  const min = Math.min(...groupIds.map(countIn))
  const group = groupIds.find((g) => countIn(g) === min)!
  return { team_id: team, pot: potNo, group_id: group, at: now }
}

export function drawAll(draw: Draw, groupIds: string[], rng: Rng = Math.random): DrawPick[] {
  let d = { ...draw, picks: [...(draw.picks ?? [])] }
  for (;;) {
    const p = drawOne(d, groupIds, rng)
    if (!p) break
    d = { ...d, picks: [...d.picks, p] }
  }
  return d.picks
}

export function groupsFromPicks(picks: DrawPick[]): Map<string, string[]> {
  const m = new Map<string, string[]>()
  for (const p of picks) { if (!m.has(p.group_id)) m.set(p.group_id, []); m.get(p.group_id)!.push(p.team_id) }
  return m
}

/** PRNG déterministe (mulberry32) — utile pour les tests et le seed */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
//  Système suisse par chapeaux (phase de ligue MBL : 5 chapeaux × 4 équipes → 5 journées, 50 matchs)
// ---------------------------------------------------------------------------
export interface SwissFixture { round: number; home_team_id: string; away_team_id: string; revealed?: boolean }

/**
 * Chaque équipe affronte exactement UNE équipe de chaque chapeau (y compris le sien), donc jamais deux fois la même.
 * Journée r : le chapeau p rencontre le chapeau q = (r − p) mod P. Le chapeau "fixe" (q = p) joue en interne.
 * Domicile/extérieur équilibré (au plus 1 d'écart) par affectation gloutonne.
 * Conditions : nombre de chapeaux impair, taille de chapeau paire et identique.
 */
export function swissPotsFixtures(pots: string[][], rng: Rng = Math.random): SwissFixture[] {
  const P = pots.length
  if (P % 2 === 0) throw new Error('Le nombre de chapeaux doit être impair')
  const size = pots[0]?.length ?? 0
  if (pots.some((p) => p.length !== size) || size % 2 !== 0) throw new Error('Les chapeaux doivent avoir la même taille (paire)')
  const shuffle = <T,>(a: T[]) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] } return x }
  const roundOrder = shuffle(Array.from({ length: P }, (_, i) => i))
  const pairs: { round: number; a: string; b: string }[] = []
  roundOrder.forEach((r, idx) => {
    for (let p = 0; p < P; p++) {
      const q = (((r - p) % P) + P) % P
      if (q < p) continue
      if (q === p) {
        const s = shuffle(pots[p])
        for (let i = 0; i < s.length; i += 2) pairs.push({ round: idx + 1, a: s[i], b: s[i + 1] })
      } else {
        const sa = shuffle(pots[p]), sb = shuffle(pots[q])
        for (let i = 0; i < size; i++) pairs.push({ round: idx + 1, a: sa[i], b: sb[i] })
      }
    }
  })
  const home = new Map<string, number>()
  const out: SwissFixture[] = []
  for (const pr of shuffle(pairs).sort((x, y) => x.round - y.round)) {
    const ha = home.get(pr.a) ?? 0, hb = home.get(pr.b) ?? 0
    const aHome = ha < hb || (ha === hb && rng() < 0.5)
    const [h, a] = aHome ? [pr.a, pr.b] : [pr.b, pr.a]
    home.set(h, (home.get(h) ?? 0) + 1)
    out.push({ round: pr.round, home_team_id: h, away_team_id: a })
  }
  return out
}

/** Chapeaux d'une cup à partir d'un classement : rangs 1-2 → chapeau 1, 3-4 → chapeau 2, … */
export function potsFromRanking(teamIds: string[], perPot: number): string[][] {
  const pots: string[][] = []
  for (let i = 0; i < teamIds.length; i += perPot) pots.push(teamIds.slice(i, i + perPot))
  return pots
}

// ---------------------------------------------------------------------------
//  Phase de sélection : N équipes (pair ou impair), R matchs par équipe
// ---------------------------------------------------------------------------
/**
 * Méthode du cercle (table de Berger) sur un ordre tiré au sort, limitée aux R premières journées :
 *  - chaque équipe joue au plus une fois par journée et jamais deux fois la même équipe ;
 *  - nombre pair d'équipes : chacune joue exactement R matchs ;
 *  - nombre impair : une équipe est exemptée à chaque journée (elle joue R − 1 matchs) ;
 *  - domicile/extérieur équilibré (au plus 1 d'écart).
 * Condition : R ≤ N − 1 (N pair) ou R ≤ N (N impair).
 */
export function selectionFixtures(teamIds: string[], rounds: number, rng: Rng = Math.random, firstRound = 1): SwissFixture[] {
  const n = teamIds.length
  if (n < 2) throw new Error('Il faut au moins 2 équipes')
  const shuffle = <T,>(a: T[]) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] } return x }
  const BYE = '__exempt__'
  const list = shuffle(teamIds)
  if (list.length % 2) list.push(BYE)
  const m = list.length
  if (rounds > m - 1) throw new Error(`Au maximum ${m - 1} matchs par équipe avec ${n} équipes`)
  // journées tirées au hasard parmi les m − 1 possibles, pour que l'ordre des affiches ne soit pas prévisible
  const which = shuffle(Array.from({ length: m - 1 }, (_, i) => i)).slice(0, rounds).sort((a, b) => a - b)
  const pairs: { round: number; a: string; b: string }[] = []
  which.forEach((r, idx) => {
    const rot = [list[0], ...Array.from({ length: m - 1 }, (_, i) => list[1 + ((i + r) % (m - 1))])]
    for (let i = 0; i < m / 2; i++) {
      const a = rot[i], b = rot[m - 1 - i]
      if (a !== BYE && b !== BYE) pairs.push({ round: firstRound + idx, a, b })
    }
  })
  // orientation domicile/extérieur : au hasard, puis rééquilibrage exact (inversion de chemins)
  const out: SwissFixture[] = shuffle(pairs).sort((x, y) => x.round - y.round).map((pr) => (rng() < 0.5 ? { round: pr.round, home_team_id: pr.a, away_team_id: pr.b } : { round: pr.round, home_team_id: pr.b, away_team_id: pr.a }))
  balanceHomeAway(out)
  return out
}
/** Nombre maximal de matchs par équipe possible */
export const maxRoundsFor = (teams: number) => (teams % 2 ? teams : teams - 1)

/**
 * Rend l'écart domicile − extérieur de chaque équipe égal à −1, 0 ou +1.
 * Tant qu'une équipe a 2 matchs à domicile de plus qu'à l'extérieur, on cherche un chemin d'affiches
 * « à domicile » qui mène à une équipe en déficit et on inverse tout le chemin : seuls les deux bouts changent.
 */
export function balanceHomeAway(fx: SwissFixture[]) {
  const diff = new Map<string, number>()
  const bump = (t: string, d: number) => diff.set(t, (diff.get(t) ?? 0) + d)
  for (const f of fx) { bump(f.home_team_id, 1); bump(f.away_team_id, -1) }
  for (let guard = 0; guard < fx.length * 4; guard++) {
    const start = [...diff.entries()].find(([, d]) => d >= 2)?.[0]
    if (!start) return fx
    // BFS en suivant les affiches où l'équipe courante reçoit
    const prev = new Map<string, number>([[start, -1]])
    const queue = [start]
    let end: string | undefined
    while (queue.length && !end) {
      const u = queue.shift()!
      for (let i = 0; i < fx.length; i++) {
        if (fx[i].home_team_id !== u) continue
        const v = fx[i].away_team_id
        if (prev.has(v)) continue
        prev.set(v, i)
        if ((diff.get(v) ?? 0) <= 0) { end = v; break }
        queue.push(v)
      }
    }
    if (!end) return fx
    for (let v = end; v !== start;) {
      const i = prev.get(v)!
      const f = fx[i]
      fx[i] = { ...f, home_team_id: f.away_team_id, away_team_id: f.home_team_id }
      v = f.home_team_id
    }
    bump(start, -2); bump(end, 2)
  }
  return fx
}
