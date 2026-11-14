import { describe, expect, it } from 'vitest'
import { computeStandings } from './standings'
import { preseasonRanking } from './preseason'
import { adjustmentLabel } from './adjustments'
import type { Match, StandingAdjustment } from '@/types/entities'

const m = (id: string, h: string, a: string, hs: number, as: number) => ({ id, home_team_id: h, away_team_id: a, home_score: hs, away_score: as, status: 'finished', validated: true, date: `2026-11-0${id.slice(1)}` }) as unknown as Match
const matches = [m('m1', 'A', 'B', 3, 1), m('m2', 'C', 'D', 2, 2), m('m3', 'A', 'C', 1, 0), m('m4', 'B', 'D', 2, 0)]
const adj = (p: Partial<StandingAdjustment>) => ({ id: Math.random().toString(), competition_id: 'c', team_id: 'A', reason: 'test', decision_date: '2026-11-20', active: true, ...p }) as StandingAdjustment

describe('ajustements de classement', () => {
  const auto = computeStandings(matches, ['A', 'B', 'C', 'D'])
  it('sans ajustement = calcul automatique', () => {
    expect(computeStandings(matches, ['A', 'B', 'C', 'D'], null, [], undefined, [], [])).toEqual(auto)
  })
  it('−6 pts fait reculer l’équipe, sans toucher au calcul automatique', () => {
    const before = JSON.stringify(auto)
    const r = computeStandings(matches, ['A', 'B', 'C', 'D'], null, [], undefined, [], [adj({ points: -6 })])
    expect(auto[0].team_id).toBe('A')
    expect(r.find((x) => x.team_id === 'A')!.points).toBe(0)
    expect(r[r.length - 1].team_id).toBe('A')
    expect(r.find((x) => x.team_id === 'A')!.adjustments).toHaveLength(1)
    expect(JSON.stringify(auto)).toBe(before)
  })
  it('buts pour / contre et différence', () => {
    const r = computeStandings(matches, ['A', 'B', 'C', 'D'], null, [], undefined, [], [adj({ team_id: 'D', gf: 3, ga: -1 })])
    const d = r.find((x) => x.team_id === 'D')!, d0 = auto.find((x) => x.team_id === 'D')!
    expect(d.gf).toBe(d0.gf + 3); expect(d.ga).toBe(d0.ga - 1); expect(d.gd).toBe(d0.gd + 4)
  })
  it('ordre imposé entre équipes à égalité de points', () => {
    // C et D ont 1 point chacun ; on impose D devant
    const tied = auto.filter((x) => x.points === auto.find((y) => y.team_id === 'D')!.points).map((x) => x.team_id)
    expect(tied).toContain('C'); expect(tied).toContain('D')
    const r = computeStandings(matches, ['A', 'B', 'C', 'D'], null, [], undefined, [], [adj({ team_id: 'D', forced_order: 1 })])
    expect(r.findIndex((x) => x.team_id === 'D')).toBeLessThan(r.findIndex((x) => x.team_id === 'C'))
  })
  it('pré-saison : points ajustés et ordre imposé', () => {
    const pm = [{ round: 1, home: 'A', away: 'B', hs: 2, as: 0, played: true }, { round: 1, home: 'C', away: 'D', hs: 1, as: 0, played: true }]
    const r = preseasonRanking(['A', 'B', 'C', 'D'], pm, { adjustments: [adj({ points: -3 })] })
    expect(r.find((x) => x.team_id === 'A')!.points).toBe(0)
    expect(r[0].team_id).toBe('C')
  })
  it('libellé public', () => {
    expect(adjustmentLabel(adj({ points: -3 }))).toBe('−3 pts : décision Ardentia du 20/11')
  })
})
