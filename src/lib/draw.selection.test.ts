import { describe, expect, it } from 'vitest'
import { maxRoundsFor, seededRng, selectionFixtures } from './draw'

const teams = (n: number) => Array.from({ length: n }, (_, i) => `t${i + 1}`)

describe('tirage de la phase de sélection', () => {
  for (const n of [4, 7, 20, 21, 24, 26]) for (const r of [3, 4, 5, 6]) {
    if (r > maxRoundsFor(n)) continue
    it(`${n} équipes · ${r} matchs par équipe`, () => {
      const fx = selectionFixtures(teams(n), r, seededRng(n * 10 + r))
      const games = new Map<string, number>(), home = new Map<string, number>(), seen = new Set<string>()
      for (const f of fx) {
        expect(f.home_team_id).not.toBe(f.away_team_id)
        const key = [f.home_team_id, f.away_team_id].sort().join('-')
        expect(seen.has(key)).toBe(false) // jamais deux fois la même affiche
        seen.add(key)
        for (const t of [f.home_team_id, f.away_team_id]) games.set(t, (games.get(t) ?? 0) + 1)
        home.set(f.home_team_id, (home.get(f.home_team_id) ?? 0) + 1)
      }
      // une seule fois par journée
      for (let round = 1; round <= r; round++) {
        const ids = fx.filter((f) => f.round === round).flatMap((f) => [f.home_team_id, f.away_team_id])
        expect(new Set(ids).size).toBe(ids.length)
      }
      for (const t of teams(n)) {
        const g = games.get(t) ?? 0
        if (n % 2 === 0) expect(g).toBe(r)
        else expect(g === r || g === r - 1).toBe(true)
        expect(Math.abs((home.get(t) ?? 0) * 2 - g)).toBeLessThanOrEqual(1) // domicile − extérieur ∈ {−1, 0, +1}
      }
      expect(fx.length).toBe(n % 2 === 0 ? (n / 2) * r : ((n - 1) / 2) * r)
    })
  }
  it('refuse trop de matchs par équipe', () => {
    expect(() => selectionFixtures(teams(4), 4)).toThrow()
  })
})
