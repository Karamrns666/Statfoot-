import { describe, expect, it } from 'vitest'
import type { MatchEvent } from '@/types/entities'
import { fmtAccuracy, fmtShots, fmtShotsPerGoal, playerMatchShots, shotAccuracy, shotsPerGoal, teamLiveShots, teamMatchShots } from './shots'
import { compareValues, sortRows } from '@/components/league/SortableTable'
import { XP_DEFAULTS, xpExamples, RACE_CRITERIA } from './xp'

const m = { id: 'm', home_team_id: 'H', away_team_id: 'A', home_score: 2, away_score: 0 }
let n = 0
const ev = (team_id: string, type: MatchEvent['type'], player_id?: string, extra: Partial<MatchEvent> = {}) => ({ id: `e${++n}`, match_id: 'm', team_id, type, player_id, ...extra }) as MatchEvent

describe('tirs', () => {
  const evs = [
    ev('H', 'goal', 'p1'), ev('H', 'shot_on_target', undefined, { auto: true }),
    ev('H', 'goal', 'p2'), ev('H', 'shot_on_target', undefined, { auto: true }),
    ev('H', 'shot_on_target', 'p1'), ev('H', 'shot_off_target', 'p1'), ev('H', 'shot_off_target', 'p2'), ev('H', 'penalty_missed', 'p2'),
    ev('A', 'save', 'gk'), // arrêt du gardien adverse = tir cadré de H
  ]
  it('joueur : un but est un tir cadré, les tirs automatiques ne sont pas comptés deux fois', () => {
    const s = playerMatchShots(evs, 'H')!
    expect(s.get('p1')).toEqual({ shots: 3, on_target: 2, goals: 1, matches: 1 })
    expect(s.get('p2')).toEqual({ shots: 3, on_target: 1, goals: 1, matches: 1 })
  })
  it('équipe : buts + tirs cadrés saisis + arrêts adverses', () => {
    expect(teamLiveShots(evs, 'H', m)).toEqual({ shots: 7, on_target: 4, shots_off_target: 3 })
    expect(teamMatchShots(m, evs, 'H')).toEqual({ shots: 7, on_target: 4, goals: 2, matches: 1 })
    expect(teamMatchShots(m, evs, 'H', { shots: 10, shots_on_target: 5 })).toEqual({ shots: 10, on_target: 5, goals: 2, matches: 1 })
  })
  it('valeurs vides : pas de saisie → « – », pas de division par zéro', () => {
    expect(playerMatchShots([ev('H', 'goal', 'p1')], 'H')).toBeNull()
    expect(teamMatchShots(m, [ev('H', 'goal', 'p1')], 'H')).toBeNull()
    expect(shotAccuracy({ shots: 0, on_target: 0 })).toBeNull()
    expect(shotsPerGoal({ shots: 4, goals: 0 })).toBeNull()
    expect(fmtShots(null, 'shots')).toBe('–')
    expect(fmtAccuracy({ shots: 0, on_target: 0, goals: 0, matches: 1 })).toBe('–')
    expect(fmtShotsPerGoal({ shots: 4, on_target: 2, goals: 0, matches: 1 })).toBe('–')
    expect(fmtAccuracy({ shots: 3, on_target: 2, goals: 1, matches: 1 })).toBe('67 %')
    expect(fmtShotsPerGoal({ shots: 7, on_target: 4, goals: 2, matches: 1 })).toBe('3,5')
  })
})

describe('tri des tableaux', () => {
  it('croissant / décroissant, vides toujours en bas, tri stable', () => {
    const rows = [{ k: 'a', v: 2 }, { k: 'b', v: null }, { k: 'c', v: 5 }, { k: 'd', v: 2 }]
    expect(sortRows(rows, (r) => r.v, 'desc').map((r) => r.k)).toEqual(['c', 'a', 'd', 'b'])
    expect(sortRows(rows, (r) => r.v, 'asc').map((r) => r.k)).toEqual(['a', 'd', 'c', 'b'])
    expect(compareValues('Élan', 'alpha', 'asc')).toBeGreaterThan(0)
  })
})

describe('explication des XP', () => {
  it('les exemples sont calculés par le moteur avec le barème en vigueur', () => {
    const [field, keeper] = xpExamples(XP_DEFAULTS)
    // 2 buts et 1 passe ×2 (adversaire 2e), victoire, carton jaune
    expect(field.total).toBe(2 * XP_DEFAULTS.goal * XP_DEFAULTS.mult_top3 + XP_DEFAULTS.assist * XP_DEFAULTS.mult_top3 + XP_DEFAULTS.win + XP_DEFAULTS.yellow)
    expect(keeper.total).toBe(XP_DEFAULTS.win + XP_DEFAULTS.clean_sheet_gk * XP_DEFAULTS.importance_league_phase + 6 * XP_DEFAULTS.save)
    // si le barème change, l'exemple suit
    expect(xpExamples({ ...XP_DEFAULTS, goal: 70 })[0].total).toBe(field.total + 2 * 20 * XP_DEFAULTS.mult_top3)
    expect(RACE_CRITERIA.xp.map((c) => c.label)).toEqual(['XP', 'buts', 'passes décisives', 'moins de matchs joués'])
  })
})

describe('arrêt du gardien = tir cadré du tireur adverse', () => {
  it('le tir cadré automatique porte le tireur et compte dans ses stats, une seule fois', async () => {
    const { buildAction } = await import('./matchEngine')
    const m = { id: 'M', home_team_id: 'A', away_team_id: 'B' }
    let n = 0
    const rows = buildAction(m, [], { match_id: 'M', team_id: 'B', type: 'save', player_id: 'GK_B', period: '1H', minute: 5 } as never, () => `id${n++}`, { shooter: 'P_A' }) as MatchEvent[]
    expect(rows).toHaveLength(2)
    expect(rows[1]).toMatchObject({ type: 'shot_on_target', team_id: 'A', player_id: 'P_A', auto: true, parent_event_id: rows[0].id })
    const shots = playerMatchShots(rows, 'A')!
    expect(shots.get('P_A')).toMatchObject({ shots: 1, on_target: 1 })
    // stats d'équipe : 1 tir cadré (l'arrêt adverse), pas 2
    expect(teamLiveShots(rows, 'A', m)).toMatchObject({ shots: 1, on_target: 1 })
    // un but : son tir automatique ne double pas le tir du buteur
    const g = buildAction(m, [], { match_id: 'M', team_id: 'A', type: 'goal', player_id: 'P_A', period: '1H', minute: 9 } as never, () => `g${n++}`) as MatchEvent[]
    expect(playerMatchShots([...rows, ...g], 'A')!.get('P_A')).toMatchObject({ shots: 2, on_target: 2, goals: 1 })
  })
})
