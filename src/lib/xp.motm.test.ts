import { describe, expect, it } from 'vitest'
import { makeLeague, matches } from './__fixtures__/league'
import { matchXPLines, xpConfig, XP_DEFAULTS } from './xp'
import { computePlayerXP } from './stats'

describe('XP — homme du match', () => {
  it('+70 XP au joueur désigné homme du match, valeur réglable par saison', () => {
    expect(XP_DEFAULTS.motm).toBe(70)
    const m = { ...matches[0], motm_player_id: 'A_FWD' }
    const data = makeLeague({ matches: [m, ...matches.slice(1)] })
    const lines = matchXPLines(data, m, xpConfig([])).filter((l) => l.key === 'motm')
    expect(lines).toEqual([expect.objectContaining({ player_id: 'A_FWD', points: 70, label: 'Homme du match' })])
    const before = computePlayerXP(makeLeague(), { seasonId: 's1' }).get('A_FWD')!.xp
    expect(computePlayerXP(data, { seasonId: 's1' }).get('A_FWD')!.xp).toBe(before + 70)
    const custom = matchXPLines(data, m, xpConfig([{ id: 'r', season_id: 's1', key: 'motm', value: 0 }], 's1')).filter((l) => l.key === 'motm')
    expect(custom).toEqual([]) // valeur 0 : aucune ligne XP
  })
})
