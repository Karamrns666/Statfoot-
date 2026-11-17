import { describe, expect, it } from 'vitest'
import type { MatchEvent } from '@/types/entities'
import { MAX_ON_FIELD, canEnter, minutesFromStints, needsEntry, pitchState, roomOnField, stints } from './pitch'
import { minutesPlayed } from './matchEngine'

let n = 0
const ev = (type: MatchEvent['type'], player_id: string | undefined, minute: number, extra: Partial<MatchEvent> = {}): MatchEvent =>
  ({ id: `e${++n}`, match_id: 'm', team_id: 'H', type, player_id, minute, period: minute > 20 ? '2H' : '1H', client_ts: String(n).padStart(4, '0'), ...extra } as MatchEvent)
const sub = (inn: string | undefined, out: string | undefined, minute: number) => ev('substitution', inn, minute, { related_player_id: out })
const LU = { starter_ids: ['g', 'a', 'b', 'c', 'd', 'e'], substitute_ids: ['s1', 's2', 's3'], goalkeeper_id: 'g' }

describe('remplacements illimités (Art. 2.4)', () => {
  it('un joueur sort puis rentre plusieurs fois', () => {
    const evs = [sub('s1', 'a', 5), sub('a', 's1', 12), sub('s1', 'a', 25), sub('a', 'b', 30)]
    const st = pitchState(LU, evs, 'H')
    expect(st.onField.sort()).toEqual(['a', 'c', 'd', 'e', 'g', 's1'])
    expect(st.bench.sort()).toEqual(['b', 's2', 's3'])
    // b, sorti à la 30e, peut revenir
    expect(canEnter(st, 'b')).toBe(true)
  })
  it('un expulsé ne peut pas revenir (Art. 2.7)', () => {
    const evs = [ev('red_card', 'a', 10), sub('a', 's1', 15)]
    const st = pitchState(LU, evs, 'H')
    expect(st.expelled.has('a')).toBe(true)
    expect(st.onField).not.toContain('a')
    expect(canEnter(st, 'a')).toBe(false)
    // le 2e jaune vaut expulsion aussi
    expect(pitchState(LU, [ev('second_yellow', 'b', 18)], 'H').expelled.has('b')).toBe(true)
  })
  it('jamais plus de 6 joueurs sur le terrain', () => {
    const evs = [sub('s1', 'a', 3), sub('s2', 'b', 8), sub('a', 's1', 10), sub('b', 's2', 14), sub('s3', 'c', 20)]
    for (let i = 0; i <= evs.length; i++) expect(pitchState(LU, evs.slice(0, i), 'H').onField.length).toBeLessThanOrEqual(MAX_ON_FIELD)
    expect(roomOnField(pitchState(LU, [], 'H'))).toBe(false)
    // équipe à 5 : une entrée sans sortant est possible
    const five = { ...LU, starter_ids: ['g', 'a', 'b', 'c', 'd'] }
    expect(roomOnField(pitchState(five, [], 'H'))).toBe(true)
    expect(pitchState(five, [sub('s1', undefined, 4)], 'H').onField.length).toBe(6)
  })
  it('temps de jeu correct avec plusieurs allers-retours', () => {
    const evs = [sub('s1', 'a', 5), sub('a', 's1', 12), sub('s1', 'a', 25), ev('red_card', 'c', 35)]
    const mp = minutesFromStints(stints(LU, evs, 'H', 40))
    expect(mp.get('a')).toBe(5 + 13) // 0-5 puis 12-25
    expect(mp.get('s1')).toBe(7 + 15) // 5-12 puis 25-40
    expect(mp.get('c')).toBe(35)
    expect(mp.get('g')).toBe(40)
    expect(minutesPlayed(LU, evs, 'H', 40).get('a')).toBe(18)
  })
  it('un but saisi pour un joueur du banc le fait entrer', () => {
    const st = pitchState(LU, [], 'H')
    expect(needsEntry('goal', st, 's2')).toBe(true)
    // l'entrée est enregistrée avant le but : il est alors sur le terrain et compte du temps de jeu
    const evs = [sub('s2', 'e', 22), ev('goal', 's2', 22)]
    expect(pitchState(LU, evs, 'H').onField).toContain('s2')
    expect(minutesFromStints(stints(LU, evs, 'H', 40)).get('s2')).toBe(18)
  })
  it('un carton sur le banc ne le fait pas entrer (Art. 2.5)', () => {
    const st = pitchState(LU, [], 'H')
    expect(needsEntry('yellow_card', st, 's3')).toBe(false)
    const after = pitchState(LU, [ev('yellow_card', 's3', 10, { card_target: 'substitute' })], 'H')
    expect(after.onField).not.toContain('s3')
    expect(after.bench).toContain('s3')
  })
  it('changement de gardien depuis le banc : enregistré, le nouveau gardien entre à la place de l’ancien (Art. 2.6)', () => {
    const st = pitchState(LU, [ev('gk_change', 's1', 15)], 'H')
    expect(st.goalkeeper).toBe('s1')
    expect(st.onField).toContain('s1')
    expect(st.onField).not.toContain('g')
    expect(st.onField.length).toBe(6)
  })
})
