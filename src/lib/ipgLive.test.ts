import { describe, expect, it } from 'vitest'
import { makeLeague, matches } from './__fixtures__/league'
import { computeSeasonIPG, top25 } from './ipgLive'

// J1 du jeu de test : A 2-0 B (A_FWD 2 buts, passe A_MID) · C 1-1 D (C_FWD sur passe C_DEF, D_MID sur passe D_FWD)
const validated = (ids: string[]) => makeLeague({ matches: matches.map((m) => ({ ...m, validated: ids.includes(m.id), validated_at: ids.includes(m.id) ? `2026-11-1${ids.indexOf(m.id)}T22:00:00Z` : undefined })) })
const scope = { seasonId: 's1', competitionIds: ['lp'] }

describe('Top 25 IPG — saison en cours', () => {
  it('formule existante, calcul à la main (J1)', () => {
    const r = computeSeasonIPG(validated(['M1', 'M2']), scope)
    expect(r.matches).toBe(2)
    const a = r.rows.find((x) => x.player_id === 'A_FWD')!
    // 3×2 + 0 + 2×100 (contribution) + 100 (victoires) − 0 + 2×0 (2-0 : pas « gagnant ») + 0 (B : 0 pt)
    expect(a).toMatchObject({ goals: 2, assists: 0, contribution: 100, win_pct: 100, clutch_score: 0, adversity: 0, raw: 306, ipg: 100, rank: 1 })
    const c = r.rows.find((x) => x.player_id === 'C_FWD')!
    // 3 + 200 + 0 + 2×3 (but du nul = gagnant) + 33,3 (D : 1 pt sur 3)
    expect(c).toMatchObject({ contribution: 100, win_pct: 0, clutch_goals: 1, clutch_score: 3, adversity: 33.3, raw: 242.3, ipg: 79.2 })
    expect(r.rows.find((x) => x.player_id === 'C_DEF')!.raw).toBe(237.3)
    expect(r.rows.find((x) => x.player_id === 'B_DEF')!.card_penalty).toBe(1)
  })
  it('ordre décroissant, égalités : IPG brut, buts + passes, matchs, puis nom', () => {
    const r = computeSeasonIPG(validated(['M1', 'M2']), scope)
    expect(r.rows.slice(0, 6).map((x) => x.player_id)).toEqual(['A_FWD', 'C_FWD', 'D_MID', 'C_DEF', 'D_FWD', 'A_MID'])
    for (let i = 1; i < r.rows.length; i++) expect(r.rows[i - 1].ipg).toBeGreaterThanOrEqual(r.rows[i].ipg)
    expect(r.rows.map((x) => x.rank)).toEqual(r.rows.map((_, i) => i + 1))
    expect(top25(r).length).toBeLessThanOrEqual(25)
  })
  it('seuls les matchs validés comptent ; joueurs sans match exclus', () => {
    const r = computeSeasonIPG(validated(['M1']), scope)
    expect(r.matches).toBe(1)
    expect(r.rows.every((x) => x.team_id === 'A' || x.team_id === 'B')).toBe(true)
    expect(computeSeasonIPG(validated([]), scope)).toEqual({ rows: [], matches: 0 })
  })
  it('simulation ignorée', () => {
    const d = validated(['M1', 'M2'])
    d.matches = d.matches.map((m) => (m.id === 'M2' ? { ...m, is_simulation: true } as typeof m : m))
    expect(computeSeasonIPG(d, scope).matches).toBe(1)
  })
  it('recalcul après la validation d’un match', () => {
    const before = computeSeasonIPG(validated(['M1', 'M2']), scope)
    const after = computeSeasonIPG(validated(['M1', 'M2', 'M3']), scope)
    expect(after.matches).toBe(3)
    expect(after.updatedAt! > before.updatedAt!).toBe(true)
    expect(after.rows.find((x) => x.player_id === 'A_MID')!.goals).toBe(1)
  })
})
