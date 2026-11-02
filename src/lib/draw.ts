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
