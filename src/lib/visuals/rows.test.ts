import { describe, expect, it } from 'vitest'
import { matches, players, teams } from '../__fixtures__/league'
import type { Match, MatchEvent } from '@/types/entities'
import { buildResultModel, resultRows, shortName } from './model'
import { captainResultModel } from './captain'
import { emptyLine } from '@/lib/captains'

const T = new Map(teams.map((t) => [t.id, t]))
const P = new Map(players.map((p) => [p.id, p]))
const ev = (id: string, type: MatchEvent['type'], team_id: string, player_id: string, o: Partial<MatchEvent> = {}): MatchEvent => ({ id, match_id: 'r', team_id, type, player_id, period: '1H', ...o })

describe('visuel Résultat — refonte (référence)', () => {
  it('nom « A.MAZRHI »', () => { expect(shortName({ first_name: 'Ayoub', last_name: 'Mazrhi' })).toBe('A.MAZRHI') })
  it('un ballon par but, cartons, C.S.C côté bénéficiaire, joueurs seulement avertis à la fin', () => {
    const m: Match = { ...matches[0], id: 'r', home_score: 5, away_score: 3, penalties: true, home_pens: 14, away_pens: 13 }
    const evs = [
      ev('1', 'goal', 'A', 'A_FWD'), ev('2', 'goal', 'A', 'A_FWD'), ev('3', 'goal', 'A', 'A_FWD'), ev('4', 'goal', 'A', 'A_FWD'),
      ev('5', 'yellow_card', 'A', 'A_FWD'), ev('6', 'yellow_card', 'A', 'A_DEF'), ev('7', 'red_card', 'A', 'A_MID'),
      ev('8', 'own_goal', 'B', 'B_DEF'), ev('9', 'goal', 'B', 'B_MID'), ev('10', 'second_yellow', 'B', 'B_GK'),
      ev('11', 'goal', 'A', 'A_MID', { period: 'PENS' }),
    ]
    const home = resultRows(m, evs, 'A', P)
    expect(home[0]).toMatchObject({ goals: 4, yellow: 1, red: 0 })
    expect(home.find((r) => r.og)).toMatchObject({ name: '(C.S.C)', goals: 1 })
    expect(home.at(-1)).toMatchObject({ goals: 0 })
    expect(home.findIndex((r) => r.og)).toBe(1) // buteurs, puis C.S.C, puis avertis
    const away = resultRows(m, evs, 'B', P)
    expect(away.some((r) => r.og)).toBe(false)
    expect(away.find((r) => r.goals === 0)).toMatchObject({ yellow: 1, red: 1 })
    const model = buildResultModel({ match: m, teams: T, players: P, events: evs })
    expect([model.homePens, model.awayPens]).toEqual([14, 13])
  })
  it('Match des capitaines : Orange contre Bleue au même format', () => {
    const lines = [{ ...emptyLine('orange', 'A_FWD'), played: true, goals: 2, yc: 1 }, { ...emptyLine('bleue', 'B_DEF'), played: true, og: 1 }, { ...emptyLine('bleue', 'B_MID'), played: true, goals: 2 }]
    const r = captainResultModel({ id: 'c', date: '2026-11-07T18:00', status: 'finished', lines, orange_pens: 4, bleue_pens: 5 }, { orange: { id: 'o', side: 'orange', name: 'Orange', player_ids: [] }, bleue: { id: 'b', side: 'bleue', name: 'Bleue', player_ids: [] } }, P)
    expect([r.homeScore, r.awayScore, r.homePens, r.awayPens]).toEqual([3, 2, undefined, undefined])
    expect(r.homeRows.map((x) => x.name)).toContain('(C.S.C)')
    expect(r.competition).toMatch(/MATCH DES CAPITAINES/)
  })
})
