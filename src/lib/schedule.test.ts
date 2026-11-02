import { describe, expect, it } from 'vitest'
import { buildBracket, planSlots, roundRobin } from './schedule'
import { drawAll, groupsFromPicks, potsFromRanking, seededRng, swissPotsFixtures } from './draw'

describe('système suisse par chapeaux', () => {
  const pots = [1, 2, 3, 4, 5].map((p) => [1, 2, 3, 4].map((i) => `p${p}t${i}`))
  const fx = swissPotsFixtures(pots, seededRng(7))
  it('20 équipes → 5 journées, 50 matchs, 10 par journée', () => {
    expect(fx).toHaveLength(50)
    for (let r = 1; r <= 5; r++) {
      const day = fx.filter((f) => f.round === r)
      expect(day).toHaveLength(10)
      expect(new Set(day.flatMap((f) => [f.home_team_id, f.away_team_id])).size).toBe(20)
    }
  })
  it('chaque équipe affronte 1 équipe de chaque chapeau, sans revanche', () => {
    for (const t of pots.flat()) {
      const opps = fx.filter((f) => f.home_team_id === t || f.away_team_id === t).map((f) => (f.home_team_id === t ? f.away_team_id : f.home_team_id))
      expect(new Set(opps).size).toBe(5)
      expect(new Set(opps.map((o) => o.slice(0, 2))).size).toBe(5)
      const home = fx.filter((f) => f.home_team_id === t).length
      expect(home === 2 || home === 3).toBe(true)
    }
  })
  it('cup à 10 équipes (5 chapeaux de 2) → 5 journées de 5 matchs', () => {
    const cup = swissPotsFixtures(potsFromRanking(Array.from({ length: 10 }, (_, i) => `r${i + 1}`), 2), seededRng(3))
    expect(cup).toHaveLength(25)
    expect(cup.filter((f) => f.round === 1)).toHaveLength(5)
  })
})

describe('calendrier & tableau', () => {
  it('aller/retour 6 équipes', () => expect(roundRobin(['a', 'b', 'c', 'd', 'e', 'f'], true)).toHaveLength(30))
  it('planification sans double créneau', () => {
    const p = planSlots(roundRobin(['a', 'b', 'c', 'd'], false), { startDate: '2026-09-05', times: ['18:00', '19:00'], pitches: [{ pitch: 'T1' }, { pitch: 'T2' }] })
    const seen = new Set<string>()
    for (const m of p) for (const t of [m.home, m.away]) { const k = `${m.date}|${t}`; expect(seen.has(k)).toBe(false); seen.add(k) }
  })
  it('tableau : demies croisées + petite finale + finale', () => {
    const b = buildBracket({ groupIds: ['GA', 'GB'], qualifiers: 4, thirdPlace: true })
    expect(b.map((x) => x.bracket_slot)).toEqual(['SF1', 'SF2', '3P', 'F'])
  })
  it('tirage en groupes par pots', () => {
    const pots = [1, 2, 3, 4].map((pot) => ({ pot, team_ids: [1, 2, 3, 4].map((i) => `p${pot}t${i}`) }))
    const picks = drawAll({ id: 'd', competition_id: 'c', pots, picks: [], one_team_per_pot_per_group: true } as never, ['A', 'B', 'C', 'D'], seededRng(42))
    for (const ids of groupsFromPicks(picks).values()) expect(new Set(ids.map((t) => t.slice(0, 2))).size).toBe(4)
  })
})
