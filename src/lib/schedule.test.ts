import { describe, expect, it } from 'vitest'
import { buildBracket, planSlots, roundRobin } from './schedule'
import { drawAll, groupsFromPicks, seededRng } from './draw'

describe('calendrier aller/retour', () => {
  it('6 équipes → 10 journées, 30 matchs, chaque paire 2 fois avec domicile inversé', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f']
    const p = roundRobin(ids, true)
    expect(p).toHaveLength(30)
    expect(new Set(p.map((x) => x.round)).size).toBe(10)
    for (let r = 1; r <= 10; r++) {
      const teams = p.filter((x) => x.round === r).flatMap((x) => [x.home, x.away])
      expect(new Set(teams).size).toBe(6)
    }
    for (const a of ids) for (const b of ids) if (a !== b) {
      expect(p.filter((x) => x.home === a && x.away === b)).toHaveLength(1)
    }
  })
  it('nombre impair → une équipe exempte par journée', () => {
    const p = roundRobin(['a', 'b', 'c', 'd', 'e'], false)
    expect(p).toHaveLength(10)
    expect(p.filter((x) => x.round === 1)).toHaveLength(2)
  })
  it('planification sans double créneau pour une équipe', () => {
    const p = planSlots(roundRobin(['a', 'b', 'c', 'd', 'e', 'f'], false), { startDate: '2026-09-05', times: ['18:00', '19:00'], pitches: [{ pitch: 'T1' }, { pitch: 'T2' }] })
    const seen = new Set<string>()
    for (const m of p) for (const t of [m.home, m.away]) { const k = `${m.date}|${t}`; expect(seen.has(k)).toBe(false); seen.add(k) }
    expect(p.filter((m) => m.round === 2)[0].date.startsWith('2026-09-12')).toBe(true)
  })
})

describe('tableau final', () => {
  it('2 groupes × 2 qualifiés → demies croisées + petite finale + finale', () => {
    const b = buildBracket({ groupIds: ['GA', 'GB'], qualifiers: 4, thirdPlace: true })
    expect(b.map((x) => x.bracket_slot)).toEqual(['SF1', 'SF2', '3P', 'F'])
    expect(b[0].home_source).toMatchObject({ ref: 'GA', rank: 1 })
    expect(b[0].away_source).toMatchObject({ ref: 'GB', rank: 2 })
    expect(b[1].home_source).toMatchObject({ ref: 'GB', rank: 1 })
    expect(b[3].home_source).toMatchObject({ type: 'winner', ref: 'SF1' })
  })
  it('ligue unique top 8 → quarts 1–8, 2–7…', () => {
    const b = buildBracket({ leagueRef: 'c', qualifiers: 8 })
    expect(b.filter((x) => x.stage === 'quarter')).toHaveLength(4)
    expect(b[0].home_source.rank).toBe(1)
    expect(b[0].away_source.rank).toBe(8)
    expect(b.at(-1)!.stage).toBe('final')
  })
})

describe('tirage au sort', () => {
  it('4 pots → 1 équipe de chaque pot par groupe', () => {
    const pots = [1, 2, 3, 4].map((pot) => ({ pot, team_ids: [1, 2, 3, 4].map((i) => `p${pot}t${i}`) }))
    const picks = drawAll({ id: 'd', competition_id: 'c', pots, picks: [], one_team_per_pot_per_group: true }, ['A', 'B', 'C', 'D'], seededRng(42))
    expect(picks).toHaveLength(16)
    const g = groupsFromPicks(picks)
    for (const ids of g.values()) {
      expect(ids).toHaveLength(4)
      expect(new Set(ids.map((t) => t.slice(0, 2))).size).toBe(4)
    }
  })
})
